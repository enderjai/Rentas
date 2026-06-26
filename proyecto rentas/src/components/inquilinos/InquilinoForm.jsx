import React, { useState, useEffect } from 'react';
import { INQUILINO_TIPOS } from '../../utils/constants';

export const InquilinoForm = ({ inquilino, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
    email: '',
    telefono: '',
    tipo: 'persona',
    activo: true,
    crearUsuario: false,
    contactoEmergencia: {
      nombre: '',
      telefono: '',
      parentesco: ''
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (inquilino) {
      setFormData({
        nombre: inquilino.nombre || '',
        rfc: inquilino.rfc || '',
        email: inquilino.email || '',
        telefono: inquilino.telefono || '',
        tipo: inquilino.tipo || 'persona',
        activo: inquilino.activo !== undefined ? inquilino.activo : true,
        crearUsuario: false,
        contactoEmergencia: inquilino.contactoEmergencia || {
          nombre: '',
          telefono: '',
          parentesco: ''
        }
      });
    }
  }, [inquilino]);

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.rfc.trim()) newErrors.rfc = 'El RFC es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
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
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
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
            Nombre / Razón Social *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Nombre completo o razón social"
          />
          {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RFC *
          </label>
          <input
            type="text"
            name="rfc"
            value={formData.rfc}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.rfc ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="RFC con homoclave"
          />
          {errors.rfc && <p className="mt-1 text-sm text-red-500">{errors.rfc}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="correo@ejemplo.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Teléfono de contacto"
          />
          {errors.telefono && <p className="mt-1 text-sm text-red-500">{errors.telefono}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo *
          </label>
          <select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {INQUILINO_TIPOS.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Activo</span>
          </label>
        </div>
      </div>

      {/* Contacto de Emergencia */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-md font-semibold text-gray-700 mb-4">Contacto de Emergencia</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="contactoEmergencia.nombre"
              value={formData.contactoEmergencia.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre del contacto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              name="contactoEmergencia.telefono"
              value={formData.contactoEmergencia.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Teléfono de emergencia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parentesco
            </label>
            <input
              type="text"
              name="contactoEmergencia.parentesco"
              value={formData.contactoEmergencia.parentesco}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Hermano, Esposa, etc."
            />
          </div>
        </div>
      </div>

      {/* Crear usuario */}
      {!inquilino && (
        <div className="border-t border-gray-200 pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="crearUsuario"
              checked={formData.crearUsuario}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Crear usuario para acceso al sistema
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Se creará un usuario con el email proporcionado y se enviará un correo para establecer contraseña
          </p>
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {inquilino ? 'Actualizar' : 'Crear'} Inquilino
        </button>
      </div>
    </form>
  );
};