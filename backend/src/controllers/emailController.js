const prisma = require("../config/prisma");

exports.getEmails = async (req, res) => {
  try {
    const { status, search } = req.query;

    const emails = await prisma.emailAccount.findMany({
      where: {
        ...(status && { status }),
        ...(search && {
          email_address: {
            contains: search,
          },
        }),
      },
      include: {
        invites: true,
      },
    });

    res.json({
      success: true,
      data: emails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

exports.createEmails = async (req, res) => {
  try {
    const data = req.body;

    const emails = await prisma.emailAccount.createMany({
      data,
    });

    res.json({
      success: true,
      data: emails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

exports.updateEmailStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.emailAccount.update({
      where: {
        id: Number(id),
      },
      data: {
        status,
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};
