import React, { useState, useEffect } from 'react';
import { METODOS_PAGO } from '../../utils/constants';
import { format } from 'date-fns';

export const PagoForm = ({ 
  contratoSeleccionado = null,
  contratos = [], 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    contratoId: contratoSeleccionado?.id || '',
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    monto: contratoSeleccionado?.montoRenta || 0,
    metodo: 'transferencia',
    comprobante: '',
    mesCorrespondiente: format(new Date(), 'yyyy-MM'),
    observaciones: '',
    inquilinoId: '',
    localId: ''
  });

  const [errors, setErrors] = useState({});
  const [contratoSeleccionadoData, setContratoSeleccionadoData] = useState(null);

  useEffect(() => {
    if (contratoSeleccionado) {
      setFormData(prev => ({
        ...prev,
        contratoId: contratoSeleccionado.id,
        monto: contratoSeleccionado.montoRenta || 0,
        inquilinoId: contratoSeleccionado.inquilinoId,
        localId: contratoSeleccionado.localId
      }));
      setContratoSeleccionadoData(contratoSeleccionado);
    }
  }, [contratoSeleccionado]);

  const handleContratoChange = (contratoId) => {
    const contrato = contratos.find(c => c.id === contratoId);
    if (contrato) {
      setContratoSeleccionadoData(contrato);
      setFormData(prev => ({
        ...prev,
        contratoId,
        monto: contrato.montoRenta || 0,
        inquilinoId: contrato.inquilinoId,
        localId: contrato.localId
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.contratoId) newErrors.contratoId = 'Selecciona un contrato';
    if (!formData.fechaPago) newErrors.fechaPago = 'La fecha de pago es requerida';
    if (formData.monto <= 0) newErrors.monto = 'El monto debe ser mayor a 0';
    if (!formData.mesCorrespondiente) newErrors.mesCorrespondiente = 'El mes correspondiente es requerido';
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
            Contrato *
          </label>
          <select
            name="contratoId"
            value={formData.contratoId}
            onChange={(e) => {
              handleContratoChange(e.target.value);
              handleChange(e);
            }}
            className={`w-full px-3 py-2 border ${errors.contratoId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Selecciona un contrato</option>
            {contratos.map(contrato => (
              <option key={contrato.id} value={contrato.id}>
                {contrato.localNombre || 'Local'} - {contrato.inquilinoNombre || 'Inquilino'}
              </option>
            ))}
          </select>
          {errors.contratoId && <p className="mt-1 text-sm text-red-500">{errors.contratoId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mes Correspondiente *
          </label>
          <input
            type="month"
            name="mesCorrespondiente"
            value={formData.mesCorrespondiente}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.mesCorrespondiente ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.mesCorrespondiente && <p className="mt-1 text-sm text-red-500">{errors.mesCorrespondiente}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Pago *
          </label>
          <input
            type="date"
            name="fechaPago"
            value={formData.fechaPago}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.fechaPago ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {errors.fechaPago && <p className="mt-1 text-sm text-red-500">{errors.fechaPago}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto *
          </label>
          <input
            type="number"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.monto ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            min="0"
            step="100"
          />
          {errors.monto && <p className="mt-1 text-sm text-red-500">{errors.monto}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de Pago *
          </label>
          <select
            name="metodo"
            value={formData.metodo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {METODOS_PAGO.map(metodo => (
              <option key={metodo.value} value={metodo.value}>
                {metodo.icon} {metodo.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comprobante (Referencia o URL)
          </label>
          <input
            type="text"
            name="comprobante"
            value={formData.comprobante}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Número de referencia o URL de imagen"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Notas adicionales..."
        />
      </div>

      {/* Información del contrato seleccionado */}
      {contratoSeleccionadoData && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Información del Contrato</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Local:</span>
              <span className="ml-2 font-medium">{contratoSeleccionadoData.localNombre}</span>
            </div>
            <div>
              <span className="text-gray-600">Inquilino:</span>
              <span className="ml-2 font-medium">{contratoSeleccionadoData.inquilinoNombre}</span>
            </div>
            <div>
              <span className="text-gray-600">Renta:</span>
              <span className="ml-2 font-medium text-green-600">
                ${contratoSeleccionadoData.montoRenta?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Día de pago:</span>
              <span className="ml-2 font-medium">Día {contratoSeleccionadoData.diaPago}</span>
            </div>
          </div>
        </div>
      )}

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
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Registrar Pago
        </button>
      </div>
    </form>
  );
};