import React, { useState } from 'react';
import { Receipt, Plus, DollarSign, Calendar, Tag, CreditCard, CheckCircle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { formatCurrency, formatDateOnly, getTodayDateString } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const AdminExpensesView: React.FC = () => {
  const { expenses, totalExpensesAmount, addExpense } = useClub();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
    date: getTodayDateString(),
    receiptNumber: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;

    addExpense({
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description || `Expense: ${formData.category}`,
      paidTo: formData.paidTo || 'Vendor / Contractor',
      paymentMethod: formData.paymentMethod,
      date: formData.date,
      receiptNumber: formData.receiptNumber || `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setIsModalOpen(false);
    setFormData({
      category: 'Dealer & Staff Wages',
      amount: 500,
      description: '',
      paidTo: '',
      paymentMethod: 'Cash',
      date: getTodayDateString(),
      receiptNumber: '',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="card-title">
            <Receipt size={18} color="#f59e0b" />
            Club Operating Expenses Management
          </h3>
          <p className="card-subtitle">
            Record dealer payroll, rent, utilities, card/chip supplies, and refreshment costs.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Record New Expense
        </button>
      </div>

      {/* Expense Total Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.8))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Club Expenses Recorded
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {formatCurrency(totalExpensesAmount)}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {expenses.length} Total Expense Vouchers Filed
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Category</th>
                <th>Description</th>
                <th>Paid To</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Date</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id}>
                  <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                    {exp.receiptNumber || exp.id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{exp.category}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                    {exp.description}
                  </td>
                  <td>{exp.paidTo}</td>
                  <td className="tabular-num" style={{ fontWeight: 800, color: '#f87171' }}>
                    {formatCurrency(exp.amount)}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.paymentMethod}</span>
                  </td>
                  <td>{formatDateOnly(exp.date)}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{exp.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Club Operating Expense"
        subtitle="Enter expense details and payment voucher reference"
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Expense Category *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
            >
              <option value="Dealer & Staff Wages">Dealer & Staff Wages</option>
              <option value="Rent & Utilities">Rent & Utilities</option>
              <option value="Cards, Chips & Tables">Cards, Chips & Table Supplies</option>
              <option value="Refreshments & F&B">Refreshments & F&B Services</option>
              <option value="Security & Surveillance">Security & Surveillance</option>
              <option value="Licensing & Compliance">Licensing & Compliance</option>
              <option value="Maintenance & Repairs">Maintenance & Repairs</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Amount ($) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Paid To / Vendor *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Floor Dealer Crew"
                value={formData.paidTo}
                onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash Drawer</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit/Debit Card">Company Card</option>
                <option value="Chips">Chips</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Receipt / Invoice Ref</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. INV-8812"
                value={formData.receiptNumber}
                onChange={e => setFormData({ ...formData, receiptNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Notes *</label>
            <textarea
              className="form-textarea"
              placeholder="Provide context for this operating cost..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Record Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
