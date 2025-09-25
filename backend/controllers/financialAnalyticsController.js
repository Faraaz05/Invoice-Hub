const Invoice = require('../models/Invoice');
const User = require('../models/User');

const getFinancialAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    // Build base match conditions
    const matchConditions = {};
    
    // Date filtering
    if (startDate || endDate) {
      matchConditions.invoiceDate = {};
      if (startDate) {
        matchConditions.invoiceDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.invoiceDate.$lte = new Date(endDate);
      }
    }
    
    // Department filtering
    if (department) {
      matchConditions.department = department;
    }

    // Aggregation pipeline for comprehensive analytics
    const analyticsData = await Invoice.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } },
          avgInvoiceAmount: { $avg: { $ifNull: ['$totals.grandTotal', 0] } },
          totalTaxAmount: { 
            $sum: { 
              $add: [
                { $ifNull: ['$totals.cgstTotal', 0] },
                { $ifNull: ['$totals.sgstTotal', 0] },
                { $ifNull: ['$totals.igstTotal', 0] }
              ]
            }
          },
          totalDiscount: { $sum: { $ifNull: ['$totals.discount', 0] } },
          pendingInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          rejectedInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'pending'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          },
          approvedAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'approved'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          },
          paidAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'paid'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          }
        }
      }
    ]);

    // Department-wise analytics
    const departmentAnalytics = await Invoice.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$department',
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } },
          avgAmount: { $avg: { $ifNull: ['$totals.grandTotal', 0] } },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'pending'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          },
          approvedAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'approved'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          },
          paidAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'paid'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await Invoice.aggregate([
      {
        $match: {
          ...matchConditions,
          invoiceDate: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$invoiceDate' },
            month: { $month: '$invoiceDate' }
          },
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } },
          avgAmount: { $avg: { $ifNull: ['$totals.grandTotal', 0] } },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          },
          paidAmount: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'paid'] }, 
                { $ifNull: ['$totals.grandTotal', 0] }, 
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Vendor analytics (top 10 by amount)
    const vendorAnalytics = await Invoice.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$billedBy.name',
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } },
          avgAmount: { $avg: { $ifNull: ['$totals.grandTotal', 0] } },
          lastInvoiceDate: { $max: '$invoiceDate' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Tax analytics
    const taxAnalytics = await Invoice.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalCGST: { $sum: { $ifNull: ['$totals.cgstTotal', 0] } },
          totalSGST: { $sum: { $ifNull: ['$totals.sgstTotal', 0] } },
          totalIGST: { $sum: { $ifNull: ['$totals.igstTotal', 0] } },
          totalTaxableAmount: { $sum: { $ifNull: ['$totals.taxableAmount', 0] } },
          avgTaxRate: {
            $avg: {
              $cond: [
                { $gt: [{ $ifNull: ['$totals.taxableAmount', 0] }, 0] },
                {
                  $multiply: [
                    {
                      $divide: [
                        {
                          $add: [
                            { $ifNull: ['$totals.cgstTotal', 0] },
                            { $ifNull: ['$totals.sgstTotal', 0] },
                            { $ifNull: ['$totals.igstTotal', 0] }
                          ]
                        },
                        { $ifNull: ['$totals.taxableAmount', 0] }
                      ]
                    },
                    100
                  ]
                },
                0
              ]
            }
          }
        }
      }
    ]);

    // GST rate distribution
    const gstRateDistribution = await Invoice.aggregate([
      { $match: matchConditions },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.gstRate',
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$items.total', 0] } },
          avgAmount: { $avg: { $ifNull: ['$items.total', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Payment status trends (last 30 days)
    const paymentTrends = await Invoice.aggregate([
      {
        $match: {
          ...matchConditions,
          invoiceDate: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 30))
          }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$invoiceDate'
              }
            }
          },
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Amount range distribution
    const amountRanges = [
      { range: '0-10K', min: 0, max: 10000 },
      { range: '10K-50K', min: 10000, max: 50000 },
      { range: '50K-1L', min: 50000, max: 100000 },
      { range: '1L-5L', min: 100000, max: 500000 },
      { range: '5L+', min: 500000, max: Infinity }
    ];

    const amountDistribution = await Promise.all(
      amountRanges.map(async (range) => {
        const matchCondition = {
          ...matchConditions,
          'totals.grandTotal': {
            $gte: range.min,
            ...(range.max !== Infinity && { $lt: range.max })
          }
        };

        const result = await Invoice.aggregate([
          { $match: matchCondition },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } }
            }
          }
        ]);

        return {
          range: range.range,
          count: result[0]?.count || 0,
          totalAmount: result[0]?.totalAmount || 0
        };
      })
    );

    // Overdue invoices analytics
    const overdueAnalytics = await Invoice.aggregate([
      {
        $match: {
          ...matchConditions,
          status: { $ne: 'paid' },
          dueDate: { $exists: true, $ne: null, $lt: new Date() }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$totals.grandTotal', 0] } },
          avgDaysOverdue: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$dueDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    ]);

    // Build response
    const response = {
      success: true,
      data: {
        overview: analyticsData[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          avgInvoiceAmount: 0,
          totalTaxAmount: 0,
          totalDiscount: 0,
          pendingInvoices: 0,
          approvedInvoices: 0,
          paidInvoices: 0,
          rejectedInvoices: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          paidAmount: 0
        },
        departmentAnalytics: departmentAnalytics || [],
        monthlyTrends: monthlyTrends || [],
        vendorAnalytics: vendorAnalytics || [],
        taxAnalytics: taxAnalytics[0] || {
          totalCGST: 0,
          totalSGST: 0,
          totalIGST: 0,
          totalTaxableAmount: 0,
          avgTaxRate: 0
        },
        gstRateDistribution: gstRateDistribution || [],
        paymentTrends: paymentTrends || [],
        amountDistribution: amountDistribution || [],
        overdueAnalytics: overdueAnalytics[0] || {
          count: 0,
          totalAmount: 0,
          avgDaysOverdue: 0
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          department: department || null
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Financial analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch financial analytics',
      error: error.message
    });
  }
};

module.exports = {
  getFinancialAnalytics
};