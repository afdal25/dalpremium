const prisma = require("../config/prisma");

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    const income = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: "PENDAPATAN",
      },
    });

    const expense = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        type: "PENGELUARAN",
      },
    });

    res.json({
      success: true,
      data: {
        transactions,
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0,
        profit:
          (income._sum.amount || 0) -
          (expense._sum.amount || 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const transaction =
      await prisma.transaction.create({
        data: req.body,
      });

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};
