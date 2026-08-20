import React, { useState } from 'react';
import { Receipt, Plus, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types';
import { formatCurrency, formatDateOnly, getTodayDateString } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const AdminExpensesView: React.FC = () => {
  const { expenses, totalExpensesAmount, addExpense, updateExpense, deleteExpense } = useClub();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
    date: getTodayDateString(),
    receiptNumber: '',
  });

  const [editFormData, setEditFormData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
    date: getTodayDateString(),
    receiptNumber: '',
  });

  const handleOpenEdit = (exp: Expense) => {
    setSelectedExpense(exp);
    setEditFormData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      paidTo: exp.paidTo,
      paymentMethod: exp.paymentMethod,
      date: exp.date,
      receiptNumber: exp.receiptNumber || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !editFormData.amount || editFormData.amount <= 0) return;

    updateExpense(selectedExpense.id, {
      category: editFormData.category,
      amount: Number(editFormData.amount),
      description: editFormData.description,
      paidTo: editFormData.paidTo,
      paymentMethod: editFormData.paymentMethod,
      date: editFormData.date,
      receiptNumber: editFormData.receiptNumber,
    });

    setIsEditModalOpen(false);
    setSelectedExpense(null);
  };

  const handleDelete = () => {
    if (!selectedExpense) return;
    deleteExpense(selectedExpense.id);
    setIsDeleteModalOpen(false);
    setSelectedExpense(null);
  };

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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="page-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={20} color="#e11d48" />
            Club Operating Expenses Management ({expenses.length})
          </h3>
          <p className="page-subtitle" style={{ fontSize: '0.84rem', color: '#475569', marginTop: '3px', fontWeight: 500 }}>
            Record, edit, and audit dealer payroll, rent, utilities, card/chip supplies, and refreshment costs.
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
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(exp)}
                        title="Edit Expense"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setSelectedExpense(exp);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete Expense"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
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
            <label className="form-label" htmlFor="expense-category">Expense Category *</label>
            <select
              id="expense-category"
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
              <label className="form-label" htmlFor="expense-amount">Amount (₹) *</label>
              <input
                id="expense-amount"
                type="number"
                className="form-input"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="expense-method">Payment Mode *</label>
              <select
                id="expense-method"
                className="form-select"
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="UPI/Digital">UPI / Digital</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="expense-paidto">Paid To (Vendor / Staff) *</label>
              <input
                id="expense-paidto"
                type="text"
                className="form-input"
                placeholder="e.g. Master Cards Supplies Ltd"
                value={formData.paidTo}
                onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="expense-date">Expense Date</label>
              <input
                id="expense-date"
                type="date"
                className="form-input"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="expense-description">Expense Description / Notes</label>
            <input
              id="expense-description"
              type="text"
              className="form-input"
              placeholder="e.g. 50 Copag 100% plastic playing card decks"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Record Expense Voucher
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      {selectedExpense && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Expense Voucher: ${selectedExpense.id}`}
          subtitle={`Recorded by: ${selectedExpense.recordedBy}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select
                className="form-select"
                value={editFormData.category}
                onChange={e => setEditFormData({ ...editFormData, category: e.target.value as ExpenseCategory })}
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
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.amount}
                  onChange={e => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select
                  className="form-select"
                  value={editFormData.paymentMethod}
                  onChange={e => setEditFormData({ ...editFormData, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI/Digital">UPI / Digital</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Paid To (Vendor / Staff) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFormData.paidTo}
                  onChange={e => setEditFormData({ ...editFormData, paidTo: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expense Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editFormData.date}
                  onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expense Description / Notes</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.description}
                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>

            <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Expense Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Expense Confirmation Modal */}
      {selectedExpense && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Expense Record"
          subtitle="Irreversible financial action"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to delete expense <strong>{selectedExpense.id}</strong> (₹{selectedExpense.amount.toLocaleString('en-IN')} for {selectedExpense.category})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Expense
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
