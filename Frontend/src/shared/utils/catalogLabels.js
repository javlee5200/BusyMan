export const ESTADO_ORDEN_OPTIONS = [
  { value: 'INGRESADO', label: 'Ingresado' },
  { value: 'DIAGNOSTICO', label: 'Diagnóstico' },
  { value: 'REPARACION', label: 'Reparación' },
  { value: 'LISTO', label: 'Listo' },
  { value: 'ENTREGADO', label: 'Entregado' },
];

export const TIPO_EQUIPO_OPTIONS = [
  { value: 'PORTATIL', label: 'Portátil' },
  { value: 'TORRE', label: 'Torre' },
  { value: 'ALL_IN_ONE', label: 'All in one' },
  { value: 'IMPRESORA', label: 'Impresora' },
  { value: 'OTRO', label: 'Otro' },
];

export const TIPO_DOCUMENTO_OPTIONS = [
  { value: 'CC', label: 'CC' },
  { value: 'CE', label: 'CE' },
  { value: 'NIT', label: 'NIT' },
  { value: 'OTRO', label: 'Otro' },
];

export const MOVIMIENTO_TIPO_OPTIONS = [
  { value: 'ENTRADA', label: 'Entrada' },
  { value: 'SALIDA', label: 'Salida' },
  { value: 'AJUSTE', label: 'Ajuste' },
];

export function getLabelByValue(options, value, fallback = '-') {
  return options.find((option) => option.value === value)?.label || fallback;
}
