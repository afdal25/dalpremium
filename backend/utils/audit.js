const prisma = require("../prisma");

const createAuditLog = async (
  action,
  user
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userName:
          user.name || user.email,
        userRole:
          user.role || "UNKNOWN",
      },
    });
  } catch (error) {
    console.log(
      "Audit log error:",
      error.message
    );
  }
};

module.exports = createAuditLog;