const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createAuditLog = require("./utils/audit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
const Joi = require("joi");

const prisma = require("./prisma");

const app = express();

const isProduction = process.env.NODE_ENV === "production";
const UPLOAD_DIR = path.join(__dirname, "uploads");
const JWT_ISSUER = process.env.JWT_ISSUER || "dalpremium-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "dalpremium-web";
const JWT_SECRET = process.env.JWT_SECRET;
const weakJwtSecrets = new Set([
  "",
  "secret",
  "password",
  "jwt_secret",
  "dalpremium_pw",
]);

if (!JWT_SECRET || JWT_SECRET.length < 32 || weakJwtSecrets.has(JWT_SECRET)) {
  const message =
    "JWT_SECRET wajib minimal 32 karakter acak. Ganti nilai di .env sebelum production.";

  if (isProduction) {
    throw new Error(message);
  }

  console.warn(`[security] ${message}`);
}

app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin tidak diizinkan oleh CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak request. Coba lagi beberapa saat.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak percobaan login/reset. Coba lagi nanti.",
  },
});

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak request order. Coba lagi beberapa saat.",
  },
});

app.use("/api", apiLimiter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use("/uploads", (req, res, next) => {
  const extension = path.extname(req.path || "").toLowerCase();

  if (!allowedUploadExtensions.has(extension)) {
    return res.status(404).json({
      message: "File tidak ditemukan",
    });
  }

  return next();
});

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    fallthrough: false,
    immutable: true,
    maxAge: "7d",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
    },
  })
);

const allowedUploadMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedUploadExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },
  fileFilter: (req, file, cb) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    if (
      allowedUploadMimeTypes.has(file.mimetype) &&
      allowedUploadExtensions.has(extension)
    ) {
      return cb(null, true);
    }

    return cb(
      new Error("File upload harus berupa gambar JPG, PNG, WEBP, atau GIF")
    );
  },
});

const cleanString = (value, maxLength = 255) => {
  if (value === undefined || value === null) {
    return "";
  }

  return sanitizeHtml(String(value), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
};

const cleanText = (value, maxLength = 10000) => {
  if (value === undefined || value === null) {
    return "";
  }

  return sanitizeHtml(String(value), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .trim()
    .slice(0, maxLength);
};

const cleanUrl = (value, maxLength = 2048) => {
  const input = cleanString(value, maxLength);

  if (!input) {
    return null;
  }

  try {
    const parsed = new URL(input);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch (error) {
    return input.startsWith("/uploads/") ? input : null;
  }
};

const sanitizeRecord = (record, fields = {}) =>
  Object.entries(fields).reduce((data, [key, options]) => {
    const value = record[key];

    if (value === undefined) {
      return data;
    }

    if (options === "text") {
      data[key] = cleanText(value);
      return data;
    }

    if (options === "url") {
      data[key] = cleanUrl(value);
      return data;
    }

    data[key] = cleanString(value, options?.max || 255);
    return data;
  }, {});

const validateBody = (schema, body) => {
  const result = schema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (result.error) {
    const message = result.error.details
      .map((detail) => detail.message)
      .join(", ");
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }

  return result.value;
};

const normalizeEmail = (email = "") => cleanString(email, 254).toLowerCase();

const getSafeErrorMessage = (error) => {
  if (error?.statusCode && error.statusCode < 500) {
    return error.message;
  }

  return isProduction
    ? "Terjadi kesalahan server"
    : error.message || "Terjadi kesalahan server";
};

const sendServerError = (res, error) => {
  if (error?.code === "P2002") {
    return res.status(409).json({
      message:
        "Data dengan kombinasi ini sudah ada. Ubah nama, durasi, atau plan.",
    });
  }

  const statusCode = error?.statusCode || 500;
  res.status(statusCode).json({
    message: getSafeErrorMessage(error),
  });
};

const signToken = (user, expiresIn = "1d") =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    }
  );

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const passwordSchema = Joi.string().min(8).max(128).required().messages({
  "string.min": "Password minimal 8 karakter",
});

const authSchemas = {
  adminLogin: Joi.object({
    email: Joi.string().email().max(254).required(),
    password: Joi.string().max(128).required(),
  }),
  customerRegister: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().max(254).required(),
    password: passwordSchema,
    phone: Joi.string().trim().max(30).allow("", null),
  }),
  customerLogin: Joi.object({
    email: Joi.string().email().max(254).required(),
    password: Joi.string().max(128).required(),
  }),
  forgotPassword: Joi.object({
    email: Joi.string().email().max(254).required(),
    phone: Joi.string().trim().min(8).max(30).required(),
  }),
  resetPassword: Joi.object({
    email: Joi.string().email().max(254).required(),
    resetToken: Joi.string().trim().alphanum().min(6).max(12).required(),
    password: passwordSchema,
  }),
  order: Joi.object({
    customerName: Joi.string().trim().min(2).max(100).required(),
    customerPhone: Joi.string().trim().min(8).max(30).required(),
    customerEmail: Joi.string().email().max(254).required(),
    targetEmail: Joi.string().email().max(254).allow("", null),
    productId: Joi.number().integer().positive().required(),
  }),
};

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token tidak ditemukan",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET,
      {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        algorithms: ["HS256"],
      }
    );

    const user = await prisma.user.findUnique({
      where: {
        id: Number(decoded.id),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user || user.email !== decoded.email || user.role !== decoded.role) {
      return res.status(401).json({
        message: "Token tidak valid",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token tidak valid",
    });
  }
};

const adminMiddleware = (
  req,
  res,
  next
) => {

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Akses ditolak",
    });
  }

  next();
};

const backofficeMiddleware = (req, res, next) => {
  if (!["ADMIN", "STAFF"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Akses admin ditolak",
    });
  }

  next();
};

const customerMiddleware = (req, res, next) => {
  if (req.user.role !== "CUSTOMER") {
    return res.status(403).json({
      message: "Akses customer ditolak",
    });
  }

  next();
};

const buildInvoice = (orderOrId) => {
  const id =
    typeof orderOrId === "object"
      ? orderOrId.id
      : orderOrId;
  const date =
    typeof orderOrId === "object" && orderOrId.createdAt
      ? new Date(orderOrId.createdAt)
      : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `DP-${year}${month}${String(id).padStart(3, "0")}`;
};

const parseInvoiceId = (invoice = "") => {
  const value = String(invoice).trim();
  const newFormatMatch = value.match(/^DP-\d{6}(\d+)$/i);

  if (newFormatMatch) {
    return Number(newFormatMatch[1]);
  }

  const match = value.match(/(\d+)$/);

  return match ? Number(match[1]) : NaN;
};

const normalizeWaNumber = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  return digits;
};

const isSharedAccountProduct = (product = {}) =>
  product.deliveryType === "ACCOUNT" &&
  String(product.plan || "")
    .toLowerCase()
    .includes("sharing");

const buildWaMessage = (type, order) => {
  const invoice = buildInvoice(order);
  const productLabel = `${order.product?.name || "Layanan"}${
    order.product?.duration ? ` ${order.product.duration}` : ""
  }${order.product?.plan ? ` ${order.product.plan}` : ""}`;

  if (type === "UNPAID") {
    return `Halo ${order.customerName}, pesanan ${invoice} untuk ${productLabel} berhasil dibuat dan menunggu pembayaran. Total: Rp ${Number(order.totalPrice).toLocaleString("id-ID")}.`;
  }

  if (type === "PAID") {
    return `Halo ${order.customerName}, pembayaran untuk pesanan ${invoice} sudah kami terima dan sedang menunggu konfirmasi admin.`;
  }

  if (order.product?.deliveryType === "ACCOUNT") {
    return `Halo ${order.customerName}, pesanan ${invoice} sudah aktif. Akun: ${order.deliveredEmail || "-"} Password: ${order.deliveredPassword || "-"}.`;
  }

  return `Halo ${order.customerName}, pesanan ${invoice} sudah aktif. Silakan cek email ${order.targetEmail || order.customerEmail} untuk menerima invite layanan premium.`;
};

const sendFonnteMessage = async (settings, phone, message) => {
  const target = String(phone || "").replace(/\D/g, "");
  const formData = new FormData();
  formData.append("target", target);
  formData.append("message", message);
  formData.append("countryCode", "62");

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: settings.waGatewayApiKey,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status === false) {
    const detail =
      payload.detail ||
      payload.reason ||
      payload.message ||
      `HTTP ${response.status}`;
    const error = new Error(`Fonnte gagal: ${detail}`);
    error.payload = payload;
    throw error;
  }

  return payload;
};

const sendWhatsAppNotification = async (type, order) => {
  try {
    const settings = await prisma.setting.findFirst();

    if (!settings?.waGatewayApiKey || !order?.customerPhone) {
      return;
    }

    const target = normalizeWaNumber(order.customerPhone);
    const message = buildWaMessage(type, order);
    const vendor = String(settings.waGatewayVendor || "").toLowerCase();

    if (vendor === "fonnte") {
      await sendFonnteMessage(settings, order.customerPhone, message);
    }
  } catch (error) {
    console.error("Gagal mengirim WhatsApp notification:", error.message, error.payload || "");
  }
};

const sendWhatsAppText = async (phone, message) => {
  try {
    const settings = await prisma.setting.findFirst();

    if (!settings?.waGatewayApiKey || !phone) {
      return false;
    }

    const vendor = String(settings.waGatewayVendor || "").toLowerCase();

    if (vendor === "fonnte") {
      await sendFonnteMessage(settings, phone, message);

      return true;
    }

    return false;
  } catch (error) {
    console.error("Gagal mengirim WhatsApp:", error.message, error.payload || "");
    return false;
  }
};

const getFrontendUrl = (req) =>
  process.env.FRONTEND_URL ||
  req.get("origin") ||
  allowedOrigins[0] ||
  `${req.protocol}://${req.get("host")}`;

const getGatewayServerKey = (settings = {}) =>
  settings.paymentGatewayPrivateKey || settings.paymentGatewayApiKey;

const isPaymentGatewayReady = (settings = {}) => {
  const vendor = String(settings.paymentGatewayVendor || "").toLowerCase();

  if (vendor === "midtrans") {
    return Boolean(getGatewayServerKey(settings));
  }

  return false;
};

const getMidtransSnapEndpoint = () =>
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const createMidtransSnapPayment = async (order, settings, req) => {
  const serverKey = getGatewayServerKey(settings);

  if (!serverKey) {
    const error = new Error("Server key Midtrans belum diisi");
    error.statusCode = 400;
    throw error;
  }

  const invoice = buildInvoice(order);
  const finishUrl = `${getFrontendUrl(req).replace(/\/$/, "")}/order/${
    order.id
  }?token=${order.accessToken}`;
  const productLabel = [
    order.product?.name,
    order.product?.duration,
    order.product?.plan,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 50);

  const response = await fetch(getMidtransSnapEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: invoice,
        gross_amount: Number(order.totalPrice),
      },
      item_details: [
        {
          id: String(order.productId),
          price: Number(order.totalPrice),
          quantity: 1,
          name: productLabel || "DALPREMIUM",
        },
      ],
      customer_details: {
        first_name: order.customerName,
        email: order.customerEmail,
        phone: normalizeWaNumber(order.customerPhone),
      },
      callbacks: {
        finish: finishUrl,
      },
      expiry: {
        unit: "minutes",
        duration: 30,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      payload.status_message ||
        payload.error_messages?.join(", ") ||
        "Gagal membuat pembayaran Midtrans"
    );
    error.statusCode = 502;
    throw error;
  }

  return {
    vendor: "midtrans",
    reference: invoice,
    token: payload.token,
    redirectUrl: payload.redirect_url,
    status: "CREATED",
    raw: JSON.stringify(payload).slice(0, 60000),
  };
};

const createPaymentGatewayPayment = async (order, req) => {
  const settings = await prisma.setting.findFirst();
  const vendor = String(settings?.paymentGatewayVendor || "").toLowerCase();

  if (!settings || !isPaymentGatewayReady(settings)) {
    return null;
  }

  if (order.paymentGatewayUrl) {
    return {
      vendor: order.paymentGatewayVendor,
      reference: order.paymentGatewayReference,
      redirectUrl: order.paymentGatewayUrl,
      status: order.paymentGatewayStatus,
    };
  }

  if (vendor !== "midtrans") {
    const error = new Error(
      `Payment gateway ${vendor || "-"} belum didukung otomatis`
    );
    error.statusCode = 400;
    throw error;
  }

  const gatewayPayment = await createMidtransSnapPayment(order, settings, req);

  await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      paymentGatewayVendor: gatewayPayment.vendor,
      paymentGatewayReference: gatewayPayment.reference,
      paymentGatewayToken: gatewayPayment.token,
      paymentGatewayUrl: gatewayPayment.redirectUrl,
      paymentGatewayStatus: gatewayPayment.status,
      paymentGatewayRaw: gatewayPayment.raw,
    },
  });

  return gatewayPayment;
};

const verifyMidtransSignature = (payload, serverKey) => {
  const signature = crypto
    .createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`
    )
    .digest("hex");

  return signature === payload.signature_key;
};

// Register Admin
app.post("/api/gate-dalprem-9f3a/create-owner", authLimiter, async (req, res) => {
  try {

    const {
  name,
  email,
  password,
  registerSecret,
  phone,
  address,
} = req.body;

    if (!name || !email || !password || !registerSecret) {
      return res.status(400).json({
        message: "Nama, email, password, dan kode register wajib diisi",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        message: "Password minimal 8 karakter",
      });
    }

    if (
      registerSecret !==
      process.env.ADMIN_REGISTER_SECRET
    ) {
      return res.status(403).json({
        message: "Kode register admin salah",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
  await prisma.user.create({
    data: {
      name,
      email: normalizeEmail(email),
      password: hashedPassword,
      role: "ADMIN",
      phone: cleanString(phone, 30) || null,
      address: cleanText(address, 1000) || null,
    },
  });

    res.json({
      message: "Register berhasil",
      user,
    });

  } catch (error) {

    sendServerError(res, error);

  }
});

// regustister staff
app.post(
  "/api/gate-dalprem-9f3a/create-staff",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
  name,
  email,
  password,
  phone,
  address,
} = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Nama, email, dan password wajib diisi",
        });
      }

      if (String(password).length < 8) {
        return res.status(400).json({
          message: "Password minimal 8 karakter",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: cleanString(name, 100),
          email: normalizeEmail(email),
          password: hashedPassword,
          role: "STAFF",
          phone: cleanString(phone, 30) || null,
          address: cleanText(address, 1000) || null,
        },
      });

      await createAuditLog(
        `Membuat staff ${user.email}`,
        req.user
    );

      res.json({
        message: "Staff berhasil dibuat",
        user,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

// Get all users (Admin only)
app.get(
  "/api/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(users);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

// Delete user (Admin only)
app.delete(
  "/api/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (id === req.user.id) {
        return res.status(400).json({
          message: "Tidak bisa menghapus akun sendiri",
        });
      }

      await prisma.user.delete({
        where: { id },
      });

      res.json({
        message: "User berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

// Login Admin
app.post("/api/gate-dalprem-9f3a/sign-in", authLimiter, async (req, res) => {
  try {
    const { email, password } = validateBody(
      authSchemas.adminLogin,
      req.body
    );
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Email tidak ditemukan",
      });
    }

    if (user.role === "CUSTOMER") {
      return res.status(403).json({
        message: "Gunakan halaman login customer",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return res.status(400).json({
        message: "Password salah",
      });
    }

    await prisma.user.update({
  where: {
    id: user.id,
  },
  data: {
    lastLoginAt: new Date(),
  },
});

await createAuditLog(
  `${user.name} login ke aplikasi`,
  user
);

    const token = signToken(user, "1d");
res.json({
  message: "Login berhasil",
  token,
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    lastLoginAt: new Date(),
    createdAt: user.createdAt,
  },
});
  } catch (error) {
    sendServerError(res, error);
  }
});

// Register Customer
app.post("/api/customers/register", authLimiter, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
    } = validateBody(authSchemas.customerRegister, req.body);
    const normalizedEmail = normalizeEmail(email);

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email: normalizedEmail,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        message: "Email sudah terdaftar",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: cleanString(name, 100),
        email: normalizedEmail,
        password: hashedPassword,
        role: "CUSTOMER",
        phone: cleanString(phone, 30) || null,
      },
    });

    const token = signToken(user, "7d");

    res.json({
      message: "Register customer berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

// Login Customer
app.post("/api/customers/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = validateBody(
      authSchemas.customerLogin,
      req.body
    );
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user || user.role !== "CUSTOMER") {
      return res.status(404).json({
        message: "Akun customer tidak ditemukan",
      });
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordValid) {
      return res.status(400).json({
        message: "Password salah",
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const token = signToken(user, "7d");

    res.json({
      message: "Login customer berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post("/api/customers/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email, phone } = validateBody(
      authSchemas.forgotPassword,
      req.body
    );
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user || user.role !== "CUSTOMER") {
      return res.status(404).json({
        message: "Akun customer tidak ditemukan",
      });
    }

    if (
      !user.phone ||
      normalizeWaNumber(user.phone) !== normalizeWaNumber(phone)
    ) {
      return res.status(400).json({
        message: "Nomor HP tidak cocok dengan akun customer",
      });
    }

    const resetToken = uuidv4()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken: hashOtp(resetToken),
        resetTokenExpiresAt: new Date(
          Date.now() + 30 * 60 * 1000
        ),
      },
    });

    const sentToWa = await sendWhatsAppText(
      user.phone,
      `OTP reset password DALPREMIUM Anda: ${resetToken}. Kode berlaku 30 menit. Abaikan pesan ini jika Anda tidak meminta reset password.`
    );

    res.json({
      message:
        sentToWa
          ? "OTP sudah dikirim ke WhatsApp terdaftar."
          : "OTP dibuat. Nomor WhatsApp belum tersedia atau gateway belum aktif.",
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post("/api/customers/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, resetToken, password } = validateBody(
      authSchemas.resetPassword,
      req.body
    );
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (
      !user ||
      user.role !== "CUSTOMER" ||
      user.resetToken !== hashOtp(resetToken.toUpperCase()) ||
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "Kode OTP tidak valid atau sudah kedaluwarsa",
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await bcrypt.hash(password, 10),
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    res.json({
      message: "Password berhasil diganti",
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

app.get(
  "/api/customers/me",
  authMiddleware,
  customerMiddleware,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(user);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/customers/me",
  authMiddleware,
  customerMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const data = {
        name: req.body.name,
        phone: req.body.phone,
      };

      if (req.file) {
        data.avatar = `/uploads/${req.file.filename}`;
      }

      const user = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          avatar: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      res.json({
        message: "Profile berhasil diperbarui",
        user,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/customers/me/password",
  authMiddleware,
  customerMiddleware,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          message: "Password lama dan baru wajib diisi",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "Password baru minimal 6 karakter",
        });
      }

      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });

      const passwordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordValid) {
        return res.status(400).json({
          message: "Password lama salah",
        });
      }

      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          password: await bcrypt.hash(newPassword, 10),
        },
      });

      res.json({
        message: "Password berhasil diganti",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.get(
  "/api/customers/orders",
  authMiddleware,
  customerMiddleware,
  async (req, res) => {
    try {
      const {
        status = "ALL",
        product = "ALL",
        dateFrom,
        dateTo,
        search = "",
      } = req.query;

      const where = {
        customerEmail: req.user.email,
      };

      if (status !== "ALL") {
        where.status = status;
      }

      if (product !== "ALL") {
        where.product = {
          is: {
            name: product,
          },
        };
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};

        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }

        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      if (search) {
        const invoiceId = parseInvoiceId(search);
        where.OR = [
          ...(Number.isNaN(invoiceId)
            ? []
            : [{ id: invoiceId }]),
          {
            customerName: {
              contains: search,
            },
          },
          {
            targetEmail: {
              contains: search,
            },
          },
        ];
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          product: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      res.json(
        orders.map((order) => ({
          ...order,
          invoice: buildInvoice(order),
        }))
      );
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| My Account
|--------------------------------------------------------------------------
*/

app.get("/api/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    sendServerError(res, error);
  }
});

app.put("/api/me", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        name,
        phone,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    await createAuditLog(
      `${user.name} mengubah profil akun`,
      user
    );

    res.json(user);
  } catch (error) {
    sendServerError(res, error);
  }
});

app.put(
  "/api/me/password",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        oldPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      if (
        !oldPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return res.status(400).json({
          message: "Semua field password wajib diisi",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: "Konfirmasi password tidak sama",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          message: "Password baru minimal 6 karakter",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user.id,
          },
        });

      const passwordValid =
        await bcrypt.compare(
          oldPassword,
          user.password
        );

      if (!passwordValid) {
        return res.status(400).json({
          message: "Password lama salah",
        });
      }

      const hashedPassword =
        await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      await createAuditLog(
        `${user.name} mengganti password akun`,
        req.user
      );

      res.json({
        message: "Password berhasil diganti",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

app.get(
  "/api/dashboard",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const { month, year } = req.query;

      const selectedMonth =
        Number(month) || new Date().getMonth() + 1;

      const selectedYear =
        Number(year) || new Date().getFullYear();

      const startDate = new Date(
        selectedYear,
        selectedMonth - 1,
        1
      );

      const endDate = new Date(
        selectedYear,
        selectedMonth,
        0,
        23,
        59,
        59
      );

      const totalEmails =
        await prisma.emailAccount.count();

      const errorEmails =
        await prisma.emailAccount.count({
          where: { status: "ERROR" },
        });

      const totalInvites =
        await prisma.familyInvite.count();

      const transactions =
        await prisma.transaction.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

      const orders =
        await prisma.order.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            product: true,
          },
        });

      const totalOrders = orders.length;

      const pendingOrders = orders.filter(
        (item) => item.status === "PENDING"
      ).length;

      const waitingOrders = orders.filter(
        (item) =>
          item.status === "WAITING_CONFIRMATION"
      ).length;

      const completedOrders = orders.filter(
        (item) => item.status === "COMPLETED"
      ).length;

      const cancelledOrders = orders.filter(
        (item) => item.status === "CANCELLED"
      ).length;

      const rejectedOrders = orders.filter(
        (item) => item.status === "REJECTED"
      ).length;

      const orderRevenue = orders
        .filter((item) => item.status === "COMPLETED")
        .reduce(
          (total, item) => total + item.totalPrice,
          0
        );

      const productMap = {};

      orders
        .filter((item) => item.status === "COMPLETED")
        .forEach((item) => {
          const duration = item.product?.duration
            ? ` - ${item.product.duration}`
            : "";
          const plan = item.product?.plan
            ? ` - ${item.product.plan}`
            : "";
          const name = item.product?.name
            ? `${item.product.name}${duration}${plan}`
            : "Unknown";

          if (!productMap[name]) {
            productMap[name] = {
              name,
              totalSold: 0,
              revenue: 0,
            };
          }

          productMap[name].totalSold += 1;
          productMap[name].revenue += item.totalPrice;
        });

      const bestSellerProducts = Object.values(
        productMap
      )
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5);

      const recentOrders =
        await prisma.order.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          include: {
            product: true,
          },
        });

      const recentTransactions =
        await prisma.transaction.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        });

      let income = 0;
      let expense = 0;

      transactions.forEach((item) => {
        if (item.type === "PENDAPATAN") {
          income += item.amount;
        }

        if (item.type === "PENGELUARAN") {
          expense += item.amount;
        }
      });

      const profit = income - expense;

      const dailyMap = {};

      transactions.forEach((item) => {
        const day = new Date(
          item.createdAt
        ).getDate();

        if (!dailyMap[day]) {
          dailyMap[day] = {
            date: String(day),
            income: 0,
            expense: 0,
            profit: 0,
          };
        }

        if (item.type === "PENDAPATAN") {
          dailyMap[day].income += item.amount;
          dailyMap[day].profit += item.amount;
        }

        if (item.type === "PENGELUARAN") {
          dailyMap[day].expense += item.amount;
          dailyMap[day].profit -= item.amount;
        }
      });

      const dailyChart = Object.values(dailyMap);

      const recentEmails =
        await prisma.emailAccount.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
          include: {
            invites: true,
          },
        });

      const recentAuditLogs =
        await prisma.auditLog.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 8,
        });

      res.json({
        totalEmails,
        errorEmails,
        totalInvites,

        income,
        expense,
        profit,

        totalOrders,
        pendingOrders,
        waitingOrders,
        completedOrders,
        cancelledOrders,
        rejectedOrders,
        orderRevenue,

        bestSellerProducts,
        recentOrders,

        dailyChart,
        recentTransactions,
        recentEmails,
        recentAuditLogs,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Emails
|--------------------------------------------------------------------------
*/

app.get("/api/emails", authMiddleware, backofficeMiddleware, async (req, res) => {
  try {
    const { search, status } = req.query;

    const emails = await prisma.emailAccount.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  {
                    serviceName: {
                      contains: search,
                    },
                  },
                  {
                    duration: {
                      contains: search,
                    },
                  },
                  {
                    plan: {
                      contains: search,
                    },
                  },
                  {
                    email: {
                      contains: search,
                    },
                  },
                  {
                    recovery: {
                      contains: search,
                    },
                  },
                ],
              }
            : {},

          status && status !== "ALL"
            ? {
                status,
              }
            : {},
        ],
      },

      include: {
        invites: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(emails);
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post("/api/emails", authMiddleware, backofficeMiddleware, async (req, res) => {
  try {
    const serviceName = cleanString(req.body.serviceName, 120);
    const duration = cleanString(req.body.duration, 80) || null;
    const plan = cleanString(req.body.plan, 80) || null;
    const email = normalizeEmail(req.body.email);
    const password = cleanString(req.body.password, 255);
    const recovery = cleanString(req.body.recovery, 255) || null;
    const status = cleanString(req.body.status, 40) || "BELUM_DIGUNAKAN";
    const familySlot = Math.max(1, Math.min(Number(req.body.familySlot) || 1, 50));

    if (!serviceName || !duration || !plan || !email || !password) {
      return res.status(400).json({
        message: "Nama layanan, durasi, plan, email, dan password wajib diisi",
      });
    }

    const newEmail = await prisma.emailAccount.create({
      data: {
        serviceName,
        duration,
        plan,
        email,
        password,
        recovery,
        status,
        familySlot,
      },
    });

    await createAuditLog(
  `Menambahkan email ${email} untuk layanan ${serviceName}`,
  req.user
);

    res.json(newEmail);
  } catch (error) {
    sendServerError(res, error);
  }
});

app.delete(
  "/api/emails/bulk-delete",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!ids || ids.length === 0) {
        return res.status(400).json({
          message: "Tidak ada email yang dipilih",
        });
      }

      const parsedIds = ids.map((id) =>
        Number(id)
      );

      const deletedEmails =
  await prisma.emailAccount.findMany({
    where: {
      id: {
        in: parsedIds,
      },
    },
  });

      // Hapus semua invite dulu
      await prisma.familyInvite.deleteMany({
        where: {
          emailAccountId: {
            in: parsedIds,
          },
        },
      });

      // Baru hapus email
      await prisma.emailAccount.deleteMany({
        where: {
          id: {
            in: parsedIds,
          },
        },
      });

      await createAuditLog(
  `Menghapus ${deletedEmails.length} email`,
  req.user
);

      res.json({
        message:
          "Email terpilih berhasil dihapus",
      });

    } catch (error) {

      sendServerError(res, error);

    }
  }
);

app.put(
  "/api/emails/bulk-status",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const { ids, status } = req.body;

      if (!ids || ids.length === 0) {
        return res.status(400).json({
          message: "Tidak ada email dipilih",
        });
      }

      await prisma.emailAccount.updateMany({
        where: {
          id: {
            in: ids.map((id) => Number(id)),
          },
        },
        data: {
          status,
        },
      });

      await createAuditLog(
  `Mengubah status ${ids.length} email menjadi ${status}`,
  req.user
);

      res.json({
        message: "Status berhasil diupdate",
      });

    } catch (error) {

      sendServerError(res, error);

    }
  }
);

app.delete(
  "/api/emails/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const id = Number(req.params.id);

    const existingEmail =
      await prisma.emailAccount.findUnique({
        where: { id },
      });

    await prisma.emailAccount.delete({
      where: { id },
    });

    await createAuditLog(
      `Menghapus email ${existingEmail?.email || id}`,
      req.user
    );

    res.json({
      message: "Deleted successfully",
    });
  }
);

app.put(
  "/api/emails/:id",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const {
        serviceName,
        duration,
        plan,
        email,
        password,
        recovery,
        status,
        familySlot,
      } = req.body;

      const updatedEmail =
        await prisma.emailAccount.update({
          where: {
            id,
          },
          data: {
            ...(serviceName && { serviceName }),
            ...(duration && { duration }),
            ...(plan && { plan }),
            ...(email && { email }),
            ...(password && { password }),
            recovery,
            ...(status && { status }),
            ...(familySlot && {
              familySlot: Number(familySlot),
            }),
          },
        });

        await createAuditLog(
  `Mengubah status email ${updatedEmail.email} menjadi ${updatedEmail.status}`,
  req.user
);

      res.json(updatedEmail);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Family Invites
|--------------------------------------------------------------------------
*/

app.get(
  "/api/emails/:id/invites",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    const id = Number(req.params.id);

    const invites =
      await prisma.familyInvite.findMany({
        where: {
          emailAccountId: id,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    res.json(invites);
  }
);

app.post(
  "/api/emails/:id/invites",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { customerEmail, status } = req.body;

      const currentEmail =
        await prisma.emailAccount.findUnique({
          where: { id },
        });

      if (!currentEmail) {
        return res.status(404).json({
          message: "Akun email tidak ditemukan",
        });
      }

      if (currentEmail.status === "ERROR") {
        return res.status(400).json({
          message:
            "Akun email sedang ERROR, tidak bisa ditambahkan",
        });
      }

      const usedSlotCount =
        await prisma.familyInvite.count({
          where: {
            emailAccountId: id,
            status: {
              in: ["PENDING", "ACCEPTED"],
            },
          },
        });

      if (usedSlotCount >= currentEmail.familySlot) {
        return res.status(400).json({
          message:
            "Slot family sudah penuh, tidak bisa ditambahkan",
        });
      }

      const existingInvite =
        await prisma.familyInvite.findFirst({
          where: {
            emailAccountId: id,
            customerEmail,
          },
        });

      if (existingInvite) {
        return res.status(400).json({
          message: "Email customer sudah terdaftar untuk akun email ini",
        });
      }

      const invite =
        await prisma.familyInvite.create({
          data: {
            customerEmail,
            status,
            emailAccountId: id,
          },
        });

      const updatedUsedSlot =
        usedSlotCount + 1;

      let emailStatus = "BELUM_DIGUNAKAN";

      if (updatedUsedSlot >= currentEmail.familySlot) {
        emailStatus = "TERJUAL";
      } else if (updatedUsedSlot > 0) {
        emailStatus = "SUDAH_DIGUNAKAN";
      }

      await prisma.emailAccount.update({
        where: { id },
        data: {
          status: emailStatus,
        },
      });

      await createAuditLog(
  `Menambahkan invite ${customerEmail} ke ${currentEmail.email}`,
  req.user
);

      res.json(invite);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/invites/:id",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const invite =
        await prisma.familyInvite.update({
          where: { id },
          data: { status },
        });

      const emailAccount =
        await prisma.emailAccount.findUnique({
          where: {
            id: invite.emailAccountId,
          },
          include: {
            invites: true,
          },
        });

      const usedSlot =
        emailAccount.invites.filter((item) =>
          ["PENDING", "ACCEPTED"].includes(item.status)
        ).length;

      let emailStatus = "BELUM_DIGUNAKAN";

      if (emailAccount.status === "ERROR") {
        emailStatus = "ERROR";
      } else if (usedSlot >= emailAccount.familySlot) {
        emailStatus = "TERJUAL";
      } else if (usedSlot > 0) {
        emailStatus = "SUDAH_DIGUNAKAN";
      }

      await prisma.emailAccount.update({
        where: {
          id: invite.emailAccountId,
        },
        data: {
          status: emailStatus,
        },
      });

      await createAuditLog(
  `Mengubah status invite ${invite.customerEmail} menjadi ${status}`,
  req.user
);

      res.json(invite);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/invites/:id",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const invite =
        await prisma.familyInvite.findUnique({
          where: { id },
        });

      if (!invite) {
        return res.status(404).json({
          message: "Email customer tidak ditemukan",
        });
      }

      const emailAccountId = invite.emailAccountId;

      await prisma.familyInvite.delete({
        where: { id },
      });

      const emailAccount =
        await prisma.emailAccount.findUnique({
          where: {
            id: emailAccountId,
          },
          include: {
            invites: true,
          },
        });

      const usedSlot =
        emailAccount.invites.filter((item) =>
          ["PENDING", "ACCEPTED"].includes(item.status)
        ).length;

      let emailStatus = "BELUM_DIGUNAKAN";

      if (emailAccount.status === "ERROR") {
        emailStatus = "ERROR";
      } else if (usedSlot >= emailAccount.familySlot) {
        emailStatus = "TERJUAL";
      } else if (usedSlot > 0) {
        emailStatus = "SUDAH_DIGUNAKAN";
      }

      await prisma.emailAccount.update({
        where: {
          id: emailAccountId,
        },
        data: {
          status: emailStatus,
        },
      });

      await createAuditLog(
  `Menghapus invite ${invite.customerEmail}`,
  req.user
);

      res.json({
        message: "Email customer berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Transactions
|--------------------------------------------------------------------------
*/

app.get(
  "/api/transactions",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const {
        search,
        type,
        startDate,
        endDate,
        sortBy,
      } = req.query;

      let orderBy = {
        createdAt: "desc",
      };

      if (sortBy === "oldest") {
        orderBy = {
          createdAt: "asc",
        };
      }

      if (sortBy === "highest") {
        orderBy = {
          amount: "desc",
        };
      }

      if (sortBy === "lowest") {
        orderBy = {
          amount: "asc",
        };
      }

      const transactions =
        await prisma.transaction.findMany({
          where: {
            AND: [
              search
                ? {
                    description: {
                      contains: search,
                    },
                  }
                : {},

              type && type !== "ALL"
                ? {
                    type,
                  }
                : {},

              startDate && endDate
                ? {
                    createdAt: {
                      gte: new Date(`${startDate}T00:00:00.000+07:00`),
                      lte: new Date(`${endDate}T23:59:59.999+07:00`),
                    },
                  }
                : {},
            ],
          },

          orderBy,
        });

      let income = 0;
      let expense = 0;

      transactions.forEach((item) => {
        if (item.type === "PENDAPATAN") {
          income += item.amount;
        }

        if (item.type === "PENGELUARAN") {
          expense += item.amount;
        }
      });

      const profit = income - expense;

      res.json({
        transactions,
        summary: {
          income,
          expense,
          profit,
        },
      });

    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/transactions",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const {
        type,
        amount,
        description,
      } = req.body;

      const transaction =
  await prisma.transaction.create({
    data: {
      type: cleanString(type, 40),
      amount: Number(amount),
      description: cleanText(description, 1000),
    },
  });

await createAuditLog(
  `Menambahkan transaksi ${type} Rp ${amount}`,
  req.user
);

      res.json(transaction);

    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/transactions/:id",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const { type, amount, description } = req.body;

      const transaction =
        await prisma.transaction.update({
          where: {
            id,
          },
          data: {
            type: cleanString(type, 40),
            amount: Number(amount),
            description: cleanText(description, 1000),
          },
        });

        await createAuditLog(
  `Mengubah transaksi ${transaction.description}`,
  req.user
);

      res.json(transaction);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/transactions/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const existingTransaction =
        await prisma.transaction.findUnique({
          where: { id },
        });

      await prisma.transaction.delete({
        where: { id },
      });

      await createAuditLog(
        `Menghapus transaksi ${existingTransaction?.description || id}`,
        req.user
      );

      res.json({
        message: "Transaction deleted successfully",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Bulk Add Emails
|--------------------------------------------------------------------------
*/

app.post(
  "/api/emails/bulk",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {

      const { emails } = req.body;

      if (
        !emails ||
        !Array.isArray(emails) ||
        emails.length === 0
      ) {
        return res.status(400).json({
          message:
            "Data bulk email kosong",
        });
      }

      const data = emails.map(
        (item, index) => {

          if (!item.email) {
            throw new Error(
              `Email kosong di baris ${
                index + 1
              }`
            );
          }

          if (!item.password) {
            throw new Error(
              `Password kosong di baris ${
                index + 1
              }`
            );
          }

          if (!item.serviceName) {
            throw new Error(
              `Nama layanan kosong di baris ${
                index + 1
              }`
            );
          }

          if (!item.duration) {
            throw new Error(
              `Durasi kosong di baris ${
                index + 1
              }`
            );
          }

          if (!item.plan) {
            throw new Error(
              `Plan kosong di baris ${
                index + 1
              }`
            );
          }

          if (
            item.familySlot &&
            isNaN(
              Number(item.familySlot)
            )
          ) {
            throw new Error(
              `Family slot harus angka di baris ${
                index + 1
              }`
            );
          }

          return {
            serviceName: item.serviceName.trim(),
            duration:
              item.duration?.trim() ||
              null,
            plan:
              item.plan?.trim() ||
              null,
            email: item.email.trim(),
            password:
              item.password.trim(),
            recovery:
              item.recovery?.trim() ||
              "",
            status:
              "BELUM_DIGUNAKAN",
            familySlot:
              Number(item.familySlot) ||
              5,
          };
        }
      );

      const result =
        await prisma.emailAccount.createMany({
          data,
          skipDuplicates: true,
        });

        await createAuditLog(
  `Bulk import ${result.count} email`,
  req.user
);

      res.json({
        message:
          "Bulk import berhasil",
        inserted: result.count,
      });

    } catch (error) {

      sendServerError(res, error);

    }
  }
);

/*
|--------------------------------------------------------------------------
| Export CSV
|--------------------------------------------------------------------------
*/

app.get(
  "/api/transactions/export/csv",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        search,
        type,
        startDate,
        endDate,
        sortBy,
      } = req.query;

      let orderBy = {
        createdAt: "desc",
      };

      if (sortBy === "oldest") {
        orderBy = {
          createdAt: "asc",
        };
      }

      if (sortBy === "highest") {
        orderBy = {
          amount: "desc",
        };
      }

      if (sortBy === "lowest") {
        orderBy = {
          amount: "asc",
        };
      }

      const transactions =
        await prisma.transaction.findMany({
          where: {
            AND: [
              search
                ? {
                    description: {
                      contains: search,
                    },
                  }
                : {},

              type && type !== "ALL"
                ? {
                    type,
                  }
                : {},

              startDate && endDate
                ? {
                    createdAt: {
                      gte: new Date(
                        `${startDate}T00:00:00.000+07:00`
                      ),
                      lte: new Date(
                        `${endDate}T23:59:59.999+07:00`
                      ),
                    },
                  }
                : {},
            ],
          },

          orderBy,
        });

      const header =
        "Type,Amount,Description,Date\n";

      const rows = transactions
        .map((item) => {
          return `${item.type},${item.amount},"${item.description}",${item.createdAt.toISOString()}`;
        })
        .join("\n");

      const csv = header + rows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=transactions.csv"
      );

      res.send(csv);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.get(
  "/api/emails/export/csv",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const emails =
        await prisma.emailAccount.findMany({
          include: {
            invites: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      const header =
        "Service,Duration,Plan,Email,Password,Recovery,Status,Slot Used,Family Slot,Created At\n";

      const rows = emails
        .map((item) => {
          return `"${item.serviceName}","${item.duration || ""}","${item.plan || ""}","${item.email}","${item.password}","${item.recovery || ""}","${item.status}",${item.invites.length},${item.familySlot},"${item.createdAt.toISOString()}"`;
        })
        .join("\n");

      const csv = header + rows;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=email-accounts.csv"
      );

      res.send(csv);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

app.get(
  "/api/notifications",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const notifications =
        await prisma.auditLog.findMany({
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        });

      res.json(notifications);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Audit Logs
|--------------------------------------------------------------------------
*/

app.get(
  "/api/audit-logs",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {

      const logs =
        await prisma.auditLog.findMany({

          orderBy: {
            createdAt: "desc",
          },

          take: 30,

        });

      res.json(logs);

    } catch (error) {

      sendServerError(res, error);

    }
  }
);

/*
|--------------------------------------------------------------------------
| Settings
|--------------------------------------------------------------------------
*/

app.get(
  "/api/settings",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      let settings =
        await prisma.setting.findFirst();

      if (!settings) {
        settings =
          await prisma.setting.create({
            data: {},
          });
      }

      res.json(settings);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/settings",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        appName,
        currency,
        timezone,
        defaultFamilySlot,
        paymentGatewayVendor,
        paymentGatewayMerchantId,
        paymentGatewayApiKey,
        paymentGatewayPrivateKey,
        paymentGatewayCallbackSecret,
        waGatewayVendor,
        waGatewayApiKey,
        waGatewaySender,
        footerDescription,
        footerEmail,
        footerPhone,
        footerWhatsapp,
        footerAddress,
        footerPaymentImage,
        footerSocialInstagram,
        footerSocialTiktok,
        footerSocialYoutube,
        footerSocialTelegram,
        footerOperationalHours,
      } = req.body;

      let settings =
        await prisma.setting.findFirst();

      if (!settings) {
        settings =
          await prisma.setting.create({
            data: {},
          });
      }

      const updatedSettings =
        await prisma.setting.update({
          where: {
            id: settings.id,
          },
          data: {
            appName: cleanString(appName, 80) || "DALPREMIUM",
            currency: cleanString(currency, 12) || "IDR",
            timezone: cleanString(timezone, 80) || "Asia/Jakarta",
            defaultFamilySlot:
              Math.max(1, Math.min(Number(defaultFamilySlot) || 5, 50)),
            paymentGatewayVendor: cleanString(paymentGatewayVendor, 40),
            paymentGatewayMerchantId: cleanString(paymentGatewayMerchantId, 255) || null,
            paymentGatewayApiKey: cleanString(paymentGatewayApiKey, 500) || null,
            paymentGatewayPrivateKey: cleanString(paymentGatewayPrivateKey, 500) || null,
            paymentGatewayCallbackSecret:
              cleanString(paymentGatewayCallbackSecret, 500) || null,
            waGatewayVendor: cleanString(waGatewayVendor, 40),
            waGatewayApiKey: cleanString(waGatewayApiKey, 500) || null,
            waGatewaySender: cleanString(waGatewaySender, 80) || null,
            footerDescription: cleanText(footerDescription, 2000) || null,
            footerEmail: normalizeEmail(footerEmail) || null,
            footerPhone: cleanString(footerPhone, 40) || null,
            footerWhatsapp: cleanString(footerWhatsapp, 40) || null,
            footerAddress: cleanText(footerAddress, 1000) || null,
            footerPaymentImage: cleanUrl(footerPaymentImage),
            footerSocialInstagram: cleanString(footerSocialInstagram, 255) || null,
            footerSocialTiktok: cleanString(footerSocialTiktok, 255) || null,
            footerSocialYoutube: cleanString(footerSocialYoutube, 255) || null,
            footerSocialTelegram: cleanString(footerSocialTelegram, 255) || null,
            footerOperationalHours: cleanText(footerOperationalHours, 1000) || null,
          },
        });

      await createAuditLog(
        "Mengubah settings aplikasi",
        req.user
      );

      res.json(updatedSettings);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/settings/logo",
  authMiddleware,
  adminMiddleware,
  upload.single("logo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Logo wajib diupload",
        });
      }

      let settings = await prisma.setting.findFirst();

      if (!settings) {
        settings = await prisma.setting.create({
          data: {},
        });
      }

      const updatedSettings =
        await prisma.setting.update({
          where: {
            id: settings.id,
          },
          data: {
            logo: `/uploads/${req.file.filename}`,
          },
        });

      await createAuditLog("Mengubah logo website", req.user);

      res.json({
        message: "Logo berhasil diperbarui",
        settings: updatedSettings,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/settings/footer-payment-image",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Gambar logo bank wajib diupload",
        });
      }

      let settings = await prisma.setting.findFirst();

      if (!settings) {
        settings = await prisma.setting.create({
          data: {},
        });
      }

      const updatedSettings =
        await prisma.setting.update({
          where: {
            id: settings.id,
          },
          data: {
            footerPaymentImage: `/uploads/${req.file.filename}`,
          },
        });

      await createAuditLog(
        "Mengubah gambar logo bank footer",
        req.user
      );

      res.json({
        message: "Gambar logo bank footer berhasil diperbarui",
        settings: updatedSettings,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/settings/footer-payment-logos",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Gambar metode pembayaran wajib diupload",
        });
      }

      const logo = await prisma.footerPaymentLogo.create({
        data: {
          image: `/uploads/${req.file.filename}`,
          title: req.body.title || null,
          sortOrder: Number(req.body.sortOrder || 0),
        },
      });

      await createAuditLog(
        "Menambah logo metode pembayaran footer",
        req.user
      );

      res.json({
        message: "Logo metode pembayaran berhasil ditambahkan",
        logo,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/settings/footer-payment-logos/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.footerPaymentLogo.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog(
        "Menghapus logo metode pembayaran footer",
        req.user
      );

      res.json({
        message: "Logo metode pembayaran berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Website Content
|--------------------------------------------------------------------------
*/

app.get("/api/content", async (req, res) => {
  try {
    const [settings, banners, testimonials, faqs, articles, legalDocuments, footerPaymentLogos] =
      await Promise.all([
        prisma.setting.findFirst(),
        prisma.banner.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        }),
        prisma.testimonialImage.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        }),
        prisma.faq.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "asc" },
          ],
        }),
        prisma.article.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.legalDocument.findMany({
          where: {
            isActive: true,
          },
        }),
        prisma.footerPaymentLogo.findMany({
          where: {
            isActive: true,
          },
          orderBy: [
            { sortOrder: "asc" },
            { createdAt: "desc" },
          ],
        }),
      ]);

    res.json({
      settings: settings
        ? {
            appName: settings.appName,
            logo: settings.logo,
            currency: settings.currency,
            timezone: settings.timezone,
            paymentGatewayVendor: settings.paymentGatewayVendor,
            paymentGatewayEnabled: isPaymentGatewayReady(settings),
            waGatewaySender: settings.waGatewaySender,
            footerDescription: settings.footerDescription,
            footerEmail: settings.footerEmail,
            footerPhone: settings.footerPhone,
            footerWhatsapp: settings.footerWhatsapp,
            footerAddress: settings.footerAddress,
            footerPaymentImage: settings.footerPaymentImage,
            footerSocialInstagram: settings.footerSocialInstagram,
            footerSocialTiktok: settings.footerSocialTiktok,
            footerSocialYoutube: settings.footerSocialYoutube,
            footerSocialTelegram: settings.footerSocialTelegram,
            footerOperationalHours: settings.footerOperationalHours,
          }
        : null,
      banners,
      testimonials,
      faqs,
      articles,
      legalDocuments,
      footerPaymentLogos,
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

app.get(
  "/api/content/admin",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const [settings, banners, testimonials, faqs, paymentMethods, articles, legalDocuments, footerPaymentLogos] =
        await Promise.all([
          prisma.setting.findFirst(),
          prisma.banner.findMany({
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "desc" },
            ],
          }),
          prisma.testimonialImage.findMany({
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "desc" },
            ],
          }),
          prisma.faq.findMany({
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "asc" },
            ],
          }),
          prisma.paymentMethod.findMany({
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "desc" },
            ],
          }),
          prisma.article.findMany({
            orderBy: {
              createdAt: "desc",
            },
          }),
          prisma.legalDocument.findMany({
            orderBy: {
              updatedAt: "desc",
            },
          }),
          prisma.footerPaymentLogo.findMany({
            orderBy: [
              { sortOrder: "asc" },
              { createdAt: "desc" },
            ],
          }),
        ]);

      res.json({
        settings,
        banners,
        testimonials,
        faqs,
        paymentMethods,
        articles,
        legalDocuments,
        footerPaymentLogos,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/content/banners",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Gambar banner wajib diupload",
        });
      }

      const banner = await prisma.banner.create({
        data: {
          image: `/uploads/${req.file.filename}`,
          sortOrder: Number(req.body.sortOrder || 0),
        },
      });

      await createAuditLog("Menambah banner shop", req.user);

      res.json({
        message: "Banner berhasil ditambahkan",
        banner,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/content/banners/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.banner.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus banner shop", req.user);

      res.json({
        message: "Banner berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/content/testimonials",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Foto testimoni wajib diupload",
        });
      }

      const testimonial =
        await prisma.testimonialImage.create({
          data: {
            image: `/uploads/${req.file.filename}`,
            sortOrder: Number(req.body.sortOrder || 0),
          },
        });

      await createAuditLog("Menambah foto testimoni", req.user);

      res.json({
        message: "Foto testimoni berhasil ditambahkan",
        testimonial,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/content/testimonials/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.testimonialImage.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus foto testimoni", req.user);

      res.json({
        message: "Foto testimoni berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/content/faqs",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        questionId,
        answerId,
        questionEn,
        answerEn,
        sortOrder,
      } = req.body;

      if (!questionId || !answerId) {
        return res.status(400).json({
          message: "Pertanyaan dan jawaban Indonesia wajib diisi",
        });
      }

      const faq = await prisma.faq.create({
        data: {
          questionId: cleanString(questionId, 500),
          answerId: cleanText(answerId, 2000),
          questionEn: cleanString(questionEn, 500) || null,
          answerEn: cleanText(answerEn, 2000) || null,
          sortOrder: Number(sortOrder || 0),
        },
      });

      await createAuditLog("Menambah FAQ shop", req.user);

      res.json({
        message: "FAQ berhasil ditambahkan",
        faq,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/content/faqs/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        questionId,
        answerId,
        questionEn,
        answerEn,
        sortOrder,
        isActive,
      } = req.body;

      const faq = await prisma.faq.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          questionId: cleanString(questionId, 500),
          answerId: cleanText(answerId, 2000),
          questionEn: cleanString(questionEn, 500) || null,
          answerEn: cleanText(answerEn, 2000) || null,
          sortOrder: Number(sortOrder || 0),
          isActive:
            typeof isActive === "boolean"
              ? isActive
              : isActive === "true",
        },
      });

      await createAuditLog("Mengubah FAQ shop", req.user);

      res.json({
        message: "FAQ berhasil diperbarui",
        faq,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/content/faqs/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.faq.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus FAQ shop", req.user);

      res.json({
        message: "FAQ berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/content/articles",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, excerpt, content, isActive } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          message: "Judul dan isi artikel wajib diisi",
        });
      }

      const article = await prisma.article.create({
        data: {
          title: cleanString(title, 180),
          slug: createSlug(title),
          excerpt: cleanText(excerpt, 1000) || null,
          content: cleanText(content, 20000),
          image: req.file ? `/uploads/${req.file.filename}` : null,
          isActive: isActive !== "false",
        },
      });

      await createAuditLog(`Menambah artikel ${title}`, req.user);

      res.json(article);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/content/articles/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, excerpt, content, isActive } = req.body;

      const data = {
        title: cleanString(title, 180),
        slug: createSlug(title),
        excerpt: cleanText(excerpt, 1000) || null,
        content: cleanText(content, 20000),
        isActive: isActive !== "false",
      };

      if (req.file) {
        data.image = `/uploads/${req.file.filename}`;
      }

      const article = await prisma.article.update({
        where: {
          id: Number(req.params.id),
        },
        data,
      });

      await createAuditLog(`Mengubah artikel ${title}`, req.user);

      res.json(article);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/content/articles/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.article.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus artikel", req.user);

      res.json({
        message: "Artikel berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.post(
  "/api/content/legal-documents",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { type, title, intro, content, note, isActive } = req.body;

      if (!type || !title || !intro || !content) {
        return res.status(400).json({
          message: "Tipe, judul, intro, dan isi wajib diisi",
        });
      }

      const document = await prisma.legalDocument.upsert({
        where: {
          type: cleanString(type, 80),
        },
        update: {
          title: cleanString(title, 180),
          intro: cleanText(intro, 2000),
          content: cleanText(content, 30000),
          note: cleanText(note, 2000) || null,
          isActive: isActive !== false,
        },
        create: {
          type: cleanString(type, 80),
          title: cleanString(title, 180),
          intro: cleanText(intro, 2000),
          content: cleanText(content, 30000),
          note: cleanText(note, 2000) || null,
          isActive: isActive !== false,
        },
      });

      await createAuditLog(`Menyimpan halaman ${title}`, req.user);

      res.json(document);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/content/legal-documents/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { type, title, intro, content, note, isActive } = req.body;

      const document = await prisma.legalDocument.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          type: cleanString(type, 80),
          title: cleanString(title, 180),
          intro: cleanText(intro, 2000),
          content: cleanText(content, 30000),
          note: cleanText(note, 2000) || null,
          isActive: isActive !== false,
        },
      });

      await createAuditLog(`Mengubah halaman ${title}`, req.user);

      res.json(document);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/content/legal-documents/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.legalDocument.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus halaman informasi", req.user);

      res.json({
        message: "Halaman berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.get("/api/payment-methods", async (req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    res.json(methods);
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post(
  "/api/payment-methods",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "qrisImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        accountNumber,
        accountName,
        instructions,
        sortOrder,
      } = req.body;

      if (!name || !accountNumber || !accountName) {
        return res.status(400).json({
          message: "Nama, nomor, dan atas nama wajib diisi",
        });
      }

      const method =
        await prisma.paymentMethod.create({
          data: {
            name: cleanString(name, 120),
            logo: req.files?.logo?.[0]
              ? `/uploads/${req.files.logo[0].filename}`
              : null,
            qrisImage: req.files?.qrisImage?.[0]
              ? `/uploads/${req.files.qrisImage[0].filename}`
              : null,
            accountNumber: cleanString(accountNumber, 120),
            accountName: cleanString(accountName, 120),
            instructions: cleanText(instructions, 1000) || null,
            sortOrder: Number(sortOrder || 0),
          },
        });

      await createAuditLog("Menambah metode pembayaran", req.user);

      res.json({
        message: "Metode pembayaran berhasil ditambahkan",
        method,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/payment-methods/:id",
  authMiddleware,
  adminMiddleware,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "qrisImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const data = {
        name: cleanString(req.body.name, 120),
        accountNumber: cleanString(req.body.accountNumber, 120),
        accountName: cleanString(req.body.accountName, 120),
        instructions: cleanText(req.body.instructions, 1000) || null,
        sortOrder: Number(req.body.sortOrder || 0),
        isActive:
          typeof req.body.isActive === "boolean"
            ? req.body.isActive
            : req.body.isActive !== "false",
      };

      if (req.files?.logo?.[0]) {
        data.logo = `/uploads/${req.files.logo[0].filename}`;
      }

      if (req.files?.qrisImage?.[0]) {
        data.qrisImage = `/uploads/${req.files.qrisImage[0].filename}`;
      }

      const method = await prisma.paymentMethod.update({
        where: {
          id: Number(req.params.id),
        },
        data,
      });

      await createAuditLog("Mengubah metode pembayaran", req.user);

      res.json({
        message: "Metode pembayaran berhasil diperbarui",
        method,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/payment-methods/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.paymentMethod.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus metode pembayaran", req.user);

      res.json({
        message: "Metode pembayaran berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Product Categories
|--------------------------------------------------------------------------
*/

const createSlug = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

app.get("/api/product-categories", async (req, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: [
        { isActive: "desc" },
        { name: "asc" },
      ],
    });

    res.json(categories);
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post(
  "/api/product-categories",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const name = cleanString(req.body.name, 100);

      if (!name) {
        return res.status(400).json({
          message: "Nama kategori wajib diisi",
        });
      }

      const category = await prisma.productCategory.create({
        data: {
          name,
          slug: createSlug(name),
        },
      });

      await createAuditLog(`Menambah kategori ${name}`, req.user);

      res.json(category);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.put(
  "/api/product-categories/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const name = cleanString(req.body.name, 100);
      const { isActive } = req.body;

      if (!name) {
        return res.status(400).json({
          message: "Nama kategori wajib diisi",
        });
      }

      const category = await prisma.productCategory.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          name,
          slug: createSlug(name),
          isActive,
        },
      });

      await createAuditLog(`Mengubah kategori ${name}`, req.user);

      res.json(category);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

app.delete(
  "/api/product-categories/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      await prisma.productCategory.delete({
        where: {
          id: Number(req.params.id),
        },
      });

      await createAuditLog("Menghapus kategori produk", req.user);

      res.json({
        message: "Kategori berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/
//get products
app.get("/api/products", async (req, res) => {
  try {
const products =
  await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

const productsWithStock =
  await Promise.all(
    products.map(async (product) => {
      let stock = 0;

      if (
        product.deliveryType === "ACCOUNT" &&
        !isSharedAccountProduct(product)
      ) {
        stock =
          await prisma.emailAccount.count({
            where: {
              serviceName: product.name,
              duration: product.duration,
              plan: product.plan,
              status: {
                notIn: [
                  "TERJUAL",
                  "ERROR",
                ],
              },
            },
          });
      }

      if (isSharedAccountProduct(product)) {
        const accounts =
          await prisma.emailAccount.findMany({
            where: {
              serviceName: product.name,
              duration: product.duration,
              plan: product.plan,
              status: {
                not: "ERROR",
              },
            },
            include: {
              invites: true,
            },
          });

        accounts.forEach((account) => {
          const usedSlot =
            account.invites.filter((invite) =>
              ["PENDING", "ACCEPTED"].includes(
                invite.status
              )
            ).length;

          stock += account.familySlot - usedSlot;
        });
      }

      if (
        product.deliveryType === "INVITE"
      ) {
        const accounts =
          await prisma.emailAccount.findMany({
            where: {
              serviceName: product.name,
              duration: product.duration,
              plan: product.plan,
              status: {
                not: "ERROR",
              },
            },
            include: {
              invites: true,
            },
          });

        accounts.forEach((account) => {
          const usedSlot =
            account.invites.filter((invite) =>
              ["PENDING", "ACCEPTED"].includes(
                invite.status
              )
            ).length;

          stock +=
            account.familySlot - usedSlot;
        });
      }

      return {
        ...product,
        stock,
      };
    })
  );

res.json(productsWithStock);
  } catch (error) {
    sendServerError(res, error);
  }
});

//add product
app.post(
  "/api/products",
  authMiddleware,
  backofficeMiddleware,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const {
        name,
        price,
        duration,
        plan,
        description,
        image,
        deliveryType,
        categoryId,
      } = req.body;

      const safeName = cleanString(name, 120);
      const safeDuration = cleanString(duration, 80) || null;
      const safePlan = cleanString(plan, 80) || null;
      const safeDeliveryType = cleanString(deliveryType, 20);
      const safePrice = Number(price);

      if (!safeName || !Number.isFinite(safePrice) || safePrice < 0) {
        return res.status(400).json({
          message: "Nama dan harga produk wajib valid",
        });
      }

      if (!["INVITE", "ACCOUNT"].includes(safeDeliveryType)) {
        return res.status(400).json({
          message: "Tipe pengiriman produk tidak valid",
        });
      }

      const slug = createSlug(`${safeName} ${safeDuration || ""} ${safePlan || ""}`);

      const product =
        await prisma.product.create({
          data: {
            name: safeName,
            slug,
            price: safePrice,
            duration: safeDuration,
            plan: safePlan,
            description: cleanText(description, 1000) || null,
            image: req.file
              ? `/uploads/${req.file.filename}`
              : cleanUrl(image),
            deliveryType: safeDeliveryType,
            categoryId: categoryId ? Number(categoryId) : null,
          },
          include: {
            category: true,
          },
        });

      await createAuditLog(
        `Menambahkan product ${name}`,
        req.user
      );

      res.json(product);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

//delete product
app.delete(
  "/api/products/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const product =
        await prisma.product.delete({
          where: {
            id: Number(req.params.id),
          },
        });

      await createAuditLog(
        `Menghapus product ${product.name}`,
        req.user
      );

      res.json({
        message:
          "Product berhasil dihapus",
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

//update product
app.put(
  "/api/products/:id",
  authMiddleware,
  backofficeMiddleware,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const {
        name,
        price,
        duration,
        plan,
        description,
        image,
        deliveryType,
        categoryId,
        isActive,
      } = req.body;

      const safeName = cleanString(name, 120);
      const safeDuration = cleanString(duration, 80) || null;
      const safePlan = cleanString(plan, 80) || null;
      const safeDeliveryType = cleanString(deliveryType, 20);
      const safePrice = Number(price);

      if (!safeName || !Number.isFinite(safePrice) || safePrice < 0) {
        return res.status(400).json({
          message: "Nama dan harga produk wajib valid",
        });
      }

      if (!["INVITE", "ACCOUNT"].includes(safeDeliveryType)) {
        return res.status(400).json({
          message: "Tipe pengiriman produk tidak valid",
        });
      }

      const slug = createSlug(`${safeName} ${safeDuration || ""} ${safePlan || ""}`);

      const product =
        await prisma.product.update({
          where: {
            id: Number(req.params.id),
          },
          data: {
            name: safeName,
            slug,
            price: safePrice,
            duration: safeDuration,
            plan: safePlan,
            description: cleanText(description, 1000) || null,
            image: req.file
              ? `/uploads/${req.file.filename}`
              : cleanUrl(image),
            deliveryType: safeDeliveryType,
            categoryId: categoryId ? Number(categoryId) : null,
            isActive: isActive === true || isActive === "true",
          },
          include: {
            category: true,
          },
        });

      await createAuditLog(
        `Mengupdate product ${name}`,
        req.user
      );

      res.json(product);
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

//order product
app.post("/api/orders", orderLimiter, async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      targetEmail,
      productId,
    } = validateBody(authSchemas.order, req.body);

    const product =
      await prisma.product.findUnique({
        where: {
          id: Number(productId),
        },
      });

    if (!product) {
      return res.status(404).json({
        message: "Product tidak ditemukan",
      });
    }

    if (
      product.deliveryType === "INVITE" &&
      !targetEmail
    ) {
      return res.status(400).json({
        message: "Email premium wajib diisi",
      });
    }

    let stock = 0;

    if (
      product.deliveryType === "ACCOUNT" &&
      !isSharedAccountProduct(product)
    ) {
      stock = await prisma.emailAccount.count({
        where: {
          serviceName: product.name,
          duration: product.duration,
          plan: product.plan,
          status: {
            notIn: ["TERJUAL", "ERROR"],
          },
        },
      });
    }

    if (isSharedAccountProduct(product)) {
      const accounts =
        await prisma.emailAccount.findMany({
          where: {
            serviceName: product.name,
            duration: product.duration,
            plan: product.plan,
            status: {
              not: "ERROR",
            },
          },
          include: {
            invites: true,
          },
        });

      accounts.forEach((account) => {
        const usedSlot =
          account.invites.filter((invite) =>
            ["PENDING", "ACCEPTED"].includes(
              invite.status
            )
          ).length;

        stock += account.familySlot - usedSlot;
      });
    }

    if (product.deliveryType === "INVITE") {
      const accounts =
        await prisma.emailAccount.findMany({
          where: {
            serviceName: product.name,
            duration: product.duration,
            plan: product.plan,
            status: {
              not: "ERROR",
            },
          },
          include: {
            invites: true,
          },
        });

      accounts.forEach((account) => {
        const usedSlot =
          account.invites.filter((invite) =>
            ["PENDING", "ACCEPTED"].includes(
              invite.status
            )
          ).length;

        stock += account.familySlot - usedSlot;
      });
    }

    if (stock <= 0) {
      return res.status(400).json({
        message: "Stok layanan ini sedang kosong",
      });
    }

    const order =
      await prisma.order.create({
        data: {
          customerName: cleanString(customerName, 100),
          customerPhone: cleanString(customerPhone, 30),
          customerEmail: normalizeEmail(customerEmail),
          targetEmail:
            product.deliveryType === "INVITE"
              ? normalizeEmail(targetEmail)
              : null,
          totalPrice: product.price,
          productId: product.id,
          status: "PENDING",
          accessToken: uuidv4(),
        },
        include: {
          product: true,
        },
      });

    let paymentGateway = null;
    let paymentGatewayError = null;

    try {
      paymentGateway = await createPaymentGatewayPayment(order, req);
    } catch (gatewayError) {
      paymentGatewayError = getSafeErrorMessage(gatewayError);
      console.error("Payment gateway error:", gatewayError.message);
    }

    res.json({
      message: "Order berhasil dibuat",
      order: {
        ...order,
        invoice: buildInvoice(order),
      },
      paymentGateway,
      paymentGatewayError,
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

// hasil order
app.get("/api/orders/:id", async (req, res) => {
  try {
    const { token } = req.query;

    const order = await prisma.order.findFirst({
      where: {
        id: Number(req.params.id),
        accessToken: token,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    res.json({
      ...order,
      invoice: buildInvoice(order),
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post("/api/orders/:id/gateway-payment", orderLimiter, async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({
        message: "Token order wajib diisi",
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: Number(req.params.id),
        accessToken: String(token),
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "Payment gateway hanya untuk order pending",
      });
    }

    const paymentGateway = await createPaymentGatewayPayment(order, req);

    if (!paymentGateway) {
      return res.status(400).json({
        message:
          "Payment gateway belum aktif. Lengkapi credential di Settings.",
      });
    }

    res.json({
      paymentGateway,
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

app.put(
  "/api/orders/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const order = await prisma.order.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: "REJECTED",
        },
        include: {
          product: true,
        },
      });

      await createAuditLog(
        `Reject order ${order.customerName} - ${order.product.name}`,
        req.user
      );

      res.json({
        message: "Order berhasil ditolak",
        order,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Order Confirmation & Approval
|--------------------------------------------------------------------------
*/

//get orders
app.get(
  "/api/orders",
  authMiddleware,
  backofficeMiddleware,
  async (req, res) => {
    try {
      const orders =
        await prisma.order.findMany({
          include: {
            product: true,
            emailAccount: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

      res.json(
        orders.map((order) => ({
          ...order,
          invoice: buildInvoice(order),
        }))
      );
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

//confirm order
app.put(
  "/api/orders/:id/payment-proof",
  orderLimiter,
  upload.single("paymentProof"),
  async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(401).json({
          message: "Token order wajib diisi",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Bukti bayar wajib diupload",
        });
      }

      const imageUrl = `${req.protocol}://${req.get(
        "host"
      )}/uploads/${req.file.filename}`;

      const existingOrder = await prisma.order.findFirst({
        where: {
          id: Number(req.params.id),
          accessToken: String(token),
        },
      });

      if (!existingOrder) {
        return res.status(404).json({
          message: "Order tidak ditemukan",
        });
      }

      if (existingOrder.status !== "PENDING") {
        return res.status(400).json({
          message: "Bukti bayar hanya bisa dikirim untuk order pending",
        });
      }

      const order = await prisma.order.update({
        where: {
          id: existingOrder.id,
        },
        data: {
          paymentProof: imageUrl,
          status: "WAITING_CONFIRMATION",
        },
        include: {
          product: true,
        },
      });

      res.json({
        message: "Bukti bayar berhasil dikirim",
        order,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

// approve order
app.put(
  "/api/orders/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const order =
        await prisma.order.findUnique({
          where: {
            id: Number(req.params.id),
          },
          include: {
            product: true,
          },
        });

      if (!order) {
        return res.status(404).json({
          message: "Order tidak ditemukan",
        });
      }

      if (order.status !== "WAITING_CONFIRMATION") {
        return res.status(400).json({
          message: "Order belum siap di-approve",
        });
      }

      const emailAccounts =
  await prisma.emailAccount.findMany({
    where: {
      serviceName: order.product.name,
      duration: order.product.duration,
      plan: order.product.plan,
      status: {
        notIn: ["ERROR", "TERJUAL"],
      },
    },
    include: {
      invites: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

let emailAccount = null;

if (
  order.product.deliveryType === "INVITE" ||
  isSharedAccountProduct(order.product)
) {
  emailAccount = emailAccounts.find((account) => {
    const usedSlot =
      account.invites.filter((invite) =>
        ["PENDING", "ACCEPTED"].includes(
          invite.status
        )
      ).length;

    return usedSlot < account.familySlot;
  });
}

if (
  order.product.deliveryType === "ACCOUNT" &&
  !isSharedAccountProduct(order.product)
) {
  emailAccount = emailAccounts[0];
}

      if (!emailAccount) {
        return res.status(400).json({
          message: "Stok akun untuk layanan ini kosong",
        });
      }

      if (
        order.product.deliveryType === "INVITE" ||
        isSharedAccountProduct(order.product)
      ) {
        const usedSlot =
          emailAccount.invites.filter((invite) =>
            ["PENDING", "ACCEPTED"].includes(
              invite.status
            )
          ).length;

        if (usedSlot >= emailAccount.familySlot) {
          return res.status(400).json({
            message: "Slot akun layanan ini sudah penuh",
          });
        }

        await prisma.familyInvite.create({
          data: {
            customerEmail:
              order.product.deliveryType === "INVITE"
                ? order.targetEmail
                : order.customerEmail,
            status:
              order.product.deliveryType === "INVITE"
                ? "PENDING"
                : "ACCEPTED",
            emailAccountId: emailAccount.id,
          },
        });

        const newUsedSlot = usedSlot + 1;

        await prisma.emailAccount.update({
          where: {
            id: emailAccount.id,
          },
          data: {
            status:
              newUsedSlot >= emailAccount.familySlot
                ? "TERJUAL"
                : "SUDAH_DIGUNAKAN",
          },
        });
      }

      if (
        order.product.deliveryType === "ACCOUNT" &&
        !isSharedAccountProduct(order.product)
      ) {
        await prisma.emailAccount.update({
          where: {
            id: emailAccount.id,
          },
          data: {
            status: "TERJUAL",
          },
        });
      }

      const updatedOrder =
        await prisma.order.update({
          where: {
            id: order.id,
          },
          data: {
  status: "COMPLETED",
  emailAccountId: emailAccount.id,

  deliveredEmail:
    order.product.deliveryType ===
    "ACCOUNT"
      ? emailAccount.email
      : null,

  deliveredPassword:
    order.product.deliveryType ===
    "ACCOUNT"
      ? emailAccount.password
      : null,
},
          include: {
            product: true,
            emailAccount: true,
          },
        });

        await prisma.transaction.create({
  data: {
    type: "PENDAPATAN",
    amount: order.totalPrice,
    description: `Order #${order.id} - ${order.product.name}${
      order.product.duration ? ` - ${order.product.duration}` : ""
    }${order.product.plan ? ` - ${order.product.plan}` : ""}`,
  },
});

      await createAuditLog(
        `Approve order ${order.customerName} - ${order.product.name}`,
        req.user
      );

      await sendWhatsAppNotification("COMPLETED", updatedOrder);

      res.json({
        message: "Order berhasil di-approve",
        order: updatedOrder,
      });
    } catch (error) {
      sendServerError(res, error);
    }
  }
);

//search orders by invoice
app.post("/api/orders/search", orderLimiter, async (req, res) => {
  try {
    const invoice = cleanString(req.body.invoice, 40);
    const phone = cleanString(req.body.phone, 30);

    if (!invoice || !phone) {
      return res.status(400).json({
        message: "Invoice dan nomor HP wajib diisi",
      });
    }

    const orderId = parseInvoiceId(invoice);

    if (Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "Format invoice tidak valid",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        id: orderId,
        customerPhone: {
          contains: phone.slice(-6),
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(
      orders.map((order) => ({
        id: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        targetEmail: order.targetEmail,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        product: order.product,
        accessToken: order.accessToken,
        invoice: buildInvoice(order),
      }))
    );
  } catch (error) {
    sendServerError(res, error);
  }
});

app.post("/api/payment-gateway/midtrans/notification", async (req, res) => {
  try {
    const payload = req.body;
    const settings = await prisma.setting.findFirst();
    const serverKey = getGatewayServerKey(settings || {});

    if (!serverKey || !payload?.order_id || !payload?.signature_key) {
      return res.status(400).json({
        message: "Notification tidak valid",
      });
    }

    if (!verifyMidtransSignature(payload, serverKey)) {
      return res.status(403).json({
        message: "Signature Midtrans tidak valid",
      });
    }

    const orderId = parseInvoiceId(payload.order_id);

    if (Number.isNaN(orderId)) {
      return res.status(400).json({
        message: "Order ID tidak valid",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        product: true,
      },
    });

    if (!order || order.paymentGatewayReference !== payload.order_id) {
      return res.status(404).json({
        message: "Order tidak ditemukan",
      });
    }

    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;
    const isPaid =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && fraudStatus === "accept");
    const isFailed = ["deny", "cancel", "expire", "failure"].includes(
      transactionStatus
    );

    const updateData = {
      paymentGatewayStatus: transactionStatus,
      paymentGatewayRaw: JSON.stringify(payload).slice(0, 60000),
    };

    if (isPaid && order.status === "PENDING") {
      updateData.status = "WAITING_CONFIRMATION";
      updateData.paidAt = new Date();
      updateData.paymentProof = `MIDTRANS:${payload.transaction_id || payload.order_id}`;
    }

    if (isFailed && order.status === "PENDING") {
      updateData.status = transactionStatus === "expire" ? "CANCELLED" : "REJECTED";
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: updateData,
      include: {
        product: true,
      },
    });

    res.json({
      message: "Notification diproses",
    });
  } catch (error) {
    sendServerError(res, error);
  }
});

/*
|--------------------------------------------------------------------------
| Auto Cancel Orders After 30 Minutes
|--------------------------------------------------------------------------
*/

let isAutoCancelRunning = false;

const autoCancelInterval = setInterval(async () => {
  if (isAutoCancelRunning) {
    return;
  }

  isAutoCancelRunning = true;

  try {
    const expiredTime = new Date(
      Date.now() - 30 * 60 * 1000
    );

    const expiredOrders =
      await prisma.order.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lte: expiredTime,
          },
        },
      });

    for (const order of expiredOrders) {
      await prisma.order.update({
        where: {
          id: order.id,
        },
        data: {
          status: "CANCELLED",
        },
      });

      console.log(
        `Order #${order.id} otomatis dibatalkan`
      );
    }
  } catch (error) {
    console.error("Auto cancel error:", error.message);
  } finally {
    isAutoCancelRunning = false;
  }
}, 60000);

app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint tidak ditemukan",
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Ukuran file maksimal 5MB"
          : "Upload file tidak valid",
    });
  }

  if (error?.message?.includes("File upload harus")) {
    return res.status(400).json({
      message: "File upload harus berupa gambar JPG, PNG, WEBP, atau GIF",
    });
  }

  if (error?.message?.includes("CORS")) {
    return res.status(403).json({
      message: "Origin tidak diizinkan",
    });
  }

  console.error("Unhandled error:", error);
  return sendServerError(res, error);
});

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} diterima, menutup server...`);
  clearInterval(autoCancelInterval);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
