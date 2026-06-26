import React, { useState, useEffect } from 'react';
import { FORMAS_PAGO } from '../../utils/constants';
import { format } from 'date-fns';

export const ContratoForm = ({ 
  contrato, 
  locales = [], 
  inquilinos = [], 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    localId: '',
    inquilinoId: '',
    fechaInicio: format(new Date(), 'yyyy-MM-dd'),
    fechaFin: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    montoRenta: 0,
    diaPago: 1,
    depositoGarantia: 0,
    formaPago: 'transferencia',
    clausulas: '',
    documentoUrl: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (contrato) {
      setFormData({
        localId: contrato.localId || '',
        inquilinoId: contrato.inquilinoId || '',
        fechaInicio: contrato.fechaInicio ? format(new Date(contrato.fechaInicio), 'yyyy-MM-dd') : '',
        fechaFin: contrato.fechaFin ? format(new Date(contrato.fechaFin), 'yyyy-MM-dd') : '',
        montoRenta: contrato.montoRenta || 0,
        diaPago: contrato.diaPago || 1,
        depositoGarantia: contrato.depositoGarantia || 0,
        formaPago: contrato.formaPago || 'transferencia',
        clausulas: contrato.clausulas || '',
        documentoUrl: contrato.documentoUrl || null
      });
    }
  }, [contrato]);

  const validate = () => {
    const newErrors = {};
    if (!formData.localId) newErrors.localId = 'Selecciona un local';
    if (!formData.inquilinoId) newErrors.inquilinoId = 'Selecciona un inquilino';
    if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';
    if (!formData.fechaFin) newErrors.fechaFin = 'La fecha de fin es requerida';
    if (formData.fechaFin && formData.fechaInicio && new Date(formData.fechaFin) <= new Date(formData.fechaInicio)) {
      newErrors.fechaFin = 'La fecha de fin debe ser mayor a la fecha de inicio';
    }
    if (formData.montoRenta <= 0) newErrors.montoRenta = 'El monto de renta debe ser mayor a 0';
    if (formData.diaPago < 1 || formData.diaPago > 31) {
      newErrors.diaPago = 'El día de pago debe estar entre 1 y 31';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Local *
          </label>
          <select
            name="localId"
            value={formData.localId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.localId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Selecciona un local</option>
            {locales.map(local => (
              <option key={local.id} value={local.id}>
                {local.nombre} - {local.estado}
              </option>
            ))}
          </select>
          {errors.localId && <p className="mt-1 text-sm text-red-500">{errors.localId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Inquilino *
          </label>
          <select
            name="inquilinoId"
            value={formData.inquilinoId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.inquilinoId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Selecciona un inquilino</option>
            {inquilinos.map(inquilino => (
              <option key={inquilino.id} value={inquilino.id}>
                {inquilino.nombre} - {inquilino.email}
              </option>
            ))}
          </select>
          {errors.inquilinoId && <p className="mt-1 text-sm text-red-500">{errors.inquilinoId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Inicio *
          </label>
          <input
            type="date"
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.fechaInicio ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.fechaInicio && <p className="mt-1 text-sm text-red-500">{errors.fechaInicio}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Fin *
          </label>
          <input
            type="date"
            name="fechaFin"
            value={formData.fechaFin}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.fechaFin ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.fechaFin && <p className="mt-1 text-sm text-red-500">{errors.fechaFin}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto de Renta Mensual *
          </label>
          <input
            type="number"
            name="montoRenta"
            value={formData.montoRenta}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.montoRenta ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            min="0"
            step="100"
          />
          {errors.montoRenta && <p className="mt-1 text-sm text-red-500">{errors.montoRenta}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Día de Pago *
          </label>
          <input
            type="number"
            name="diaPago"
            value={formData.diaPago}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.diaPago ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            min="1"
            max="31"
          />
          {errors.diaPago && <p className="mt-1 text-sm text-red-500">{errors.diaPago}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Depósito de Garantía
          </label>
          <input
            type="number"
            name="depositoGarantia"
            value={formData.depositoGarantia}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Forma de Pago
          </label>
          <select
            name="formaPago"
            value={formData.formaPago}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FORMAS_PAGO.map(forma => (
              <option key={forma.value} value={forma.value}>
                {forma.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cláusulas Especiales
        </label>
        <textarea
          name="clausulas"
          value={formData.clausulas}
          onChange={handleChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cláusulas adicionales del contrato..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {contrato ? 'Actualizar' : 'Crear'} Contrato
        </button>
      </div>
    </form>
  );
};