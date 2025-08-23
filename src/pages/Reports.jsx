import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Users,
  Package,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ParticleEffect from '../components/ParticleEffect';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('productivity');
  const [dateRange, setDateRange] = useState('week');
  const [reportData, setReportData] = useState(null);

  const reports = [
    {
      id: 'productivity',
      name: 'Picker/Packer Productivity',
      icon: Users,
      description: 'Staff performance metrics and leaderboard'
    },
    {
      id: 'inventory',
      name: 'Inventory Turnover',
      icon: Package,
      description: 'Stock movement and turnover analysis'
    },
    {
      id: 'fulfillment',
      name: 'Fulfillment Time Analysis',
      icon: Clock,
      description: 'Order processing time breakdown'
    },
    {
      id: 'accuracy',
      name: 'Accuracy Report',
      icon: Award,
      description: 'Picking and packing accuracy metrics'
    }
  ];

  useEffect(() => {
    generateReportData();
  }, [selectedReport, dateRange]);

  const generateReportData = () => {
    // Mock data generation based on report type
    switch (selectedReport) {
      case 'productivity':
        setReportData({
          leaderboard: [
            { name: 'Mike Johnson', role: 'Picker', itemsProcessed: 523, accuracy: 98.5, avgTime: 45 },
            { name: 'Emma Wilson', role: 'Packer', itemsProcessed: 412, accuracy: 99.8, avgTime: 120 },
            { name: 'James Liu', role: 'Receiver', itemsProcessed: 345, accuracy: 99.5, avgTime: 180 },
            { name: 'Sarah Chen', role: 'Admin', itemsProcessed: 287, accuracy: 100, avgTime: 90 }
          ],
          dailyTrend: [
            { day: 'Mon', picks: 145, packs: 132 },
            { day: 'Tue', picks: 189, packs: 176 },
            { day: 'Wed', picks: 167, packs: 154 },
            { day: 'Thu', picks: 198, packs: 187 },
            { day: 'Fri', picks: 212, packs: 198 },
            { day: 'Sat', picks: 98, packs: 87 },
            { day: 'Sun', picks: 45, packs: 41 }
          ]
        });
        break;

      case 'inventory':
        setReportData({
          turnover: [
            { category: 'Sensors', turnoverRate: 8.5, stockValue: 45000 },
            { category: 'Control Panels', turnoverRate: 5.2, stockValue: 125000 },
            { category: 'Sirens', turnoverRate: 6.8, stockValue: 35000 },
            { category: 'Keypads', turnoverRate: 7.1, stockValue: 55000 },
            { category: 'Cameras', turnoverRate: 9.2, stockValue: 85000 }
          ],
          stockLevels: [
            { name: 'Optimal', value: 65, color: '#10b981' },
            { name: 'Low Stock', value: 20, color: '#f59e0b' },
            { name: 'Overstock', value: 15, color: '#ef4444' }
          ]
        });
        break;

      case 'fulfillment':
        setReportData({
          timeBreakdown: [
            { stage: 'Order Receipt', avgMinutes: 5 },
            { stage: 'Picking', avgMinutes: 45 },
            { stage: 'Packing', avgMinutes: 15 },
            { stage: 'Shipping', avgMinutes: 10 }
          ],
          dailyPerformance: [
            { date: '01/07', avgTime: 72, orders: 45 },
            { date: '02/07', avgTime: 68, orders: 52 },
            { date: '03/07', avgTime: 75, orders: 48 },
            { date: '04/07', avgTime: 65, orders: 61 },
            { date: '05/07', avgTime: 70, orders: 55 }
          ]
        });
        break;

      case 'accuracy':
        setReportData({
          accuracyByType: [
            { type: 'Picking', accuracy: 98.7, errors: 12 },
            { type: 'Packing', accuracy: 99.5, errors: 4 },
            { type: 'Receiving', accuracy: 99.2, errors: 7 },
            { type: 'Stock Count', accuracy: 98.9, errors: 9 }
          ],
          errorTrend: [
            { week: 'W1', errors: 15 },
            { week: 'W2', errors: 12 },
            { week: 'W3', errors: 8 },
            { week: 'W4', errors: 5 }
          ]
        });
        break;
    }
  };

  const handleExport = () => {
    // Mock CSV export
    toast.success('Report exported to CSV');
  };

  const renderReport = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'productivity':
        return (
          <>
            {/* Leaderboard */}
            <div className="glass-card p-6 rounded-xl mb-6">
              <h3 className="text-lg font-semibold mb-4">Productivity Leaderboard</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4">Rank</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-right py-3 px-4">Items</th>
                      <th className="text-right py-3 px-4">Accuracy</th>
                      <th className="text-right py-3 px-4">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.leaderboard.map((user, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="py-3 px-4">
                          <span className={`text-lg ${index < 3 ? 'text-primary font-bold' : ''}`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-400">{user.role}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {user.itemsProcessed}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`${user.accuracy >= 99 ? 'text-green-500' : ''}`}>
                            {user.accuracy}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">{user.avgTime}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-4">Daily Activity Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="day" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="picks" fill="#3b82f6" name="Picks" />
                  <Bar dataKey="packs" fill="#60a5fa" name="Packs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        );

      case 'inventory':
        return (
          <>
            {/* Turnover Rates */}
            <div className="chart-container mb-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Turnover by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.turnover}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="category" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="turnoverRate" fill="#3b82f6" name="Turnover Rate" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Stock Levels Pie Chart */}
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-4">Stock Level Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.stockLevels}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {reportData.stockLevels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        );

      case 'fulfillment':
        return (
          <>
            {/* Time Breakdown */}
            <div className="chart-container mb-6">
              <h3 className="text-lg font-semibold mb-4">Average Fulfillment Time Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.timeBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis dataKey="stage" type="category" stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgMinutes" fill="#3b82f6" name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Daily Performance */}
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-4">Daily Fulfillment Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.dailyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis yAxisId="left" stroke="#666" />
                  <YAxis yAxisId="right" orientation="right" stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgTime" 
                    stroke="#3b82f6" 
                    name="Avg Time (min)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#60a5fa" 
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        );

      case 'accuracy':
        return (
          <>
            {/* Accuracy by Type */}
            <div className="glass-card p-6 rounded-xl mb-6">
              <h3 className="text-lg font-semibold mb-4">Accuracy by Operation Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reportData.accuracyByType.map((type) => (
                  <div key={type.type} className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-2">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-white/10"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 36 * type.accuracy / 100} ${2 * Math.PI * 36}`}
                          className={type.accuracy >= 99 ? 'text-green-500' : 'text-primary'}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{type.accuracy}%</span>
                      </div>
                    </div>
                    <p className="font-medium">{type.type}</p>
                    <p className="text-sm text-gray-400">{type.errors} errors</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Trend */}
            <div className="chart-container">
              <h3 className="text-lg font-semibold mb-4">Weekly Error Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.errorTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="week" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-6">
      <ParticleEffect />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Management Reports</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input-field"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button
            onClick={handleExport}
            className="btn-primary flex items-center"
          >
            <Download className="mr-2" size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <motion.button
              key={report.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedReport(report.id)}
              className={`p-6 rounded-xl text-left transition-all ${
                selectedReport === report.id
                  ? 'glass-card border-primary'
                  : 'glass-card hover:border-white/20'
              }`}
            >
              <Icon size={24} className="mb-3 text-primary" />
              <h3 className="font-semibold mb-1">{report.name}</h3>
              <p className="text-sm text-gray-400">{report.description}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Report Content */}
      <motion.div
        key={selectedReport}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {renderReport()}
      </motion.div>
    </div>
  );
};

export default Reports;