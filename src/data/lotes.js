/**
 * Datos de ejemplo. Reemplazar por el cliente HTTP real cuando exista la API.
 * La forma de `Lote` es el contrato que consume toda la UI de trazabilidad.
 *
 * Lote {
 *   codigo, clamshell, variedad, productor, fundo, ubicacion, hectareas,
 *   fechaCosecha, calibre, brix, certificaciones[], cosechador,
 *   pesticidas[], destino, eventos[]
 * }
 * Cosechador { nombre, cuadrilla, campanas }
 * Pesticida  { id, nombre, tipo, objetivo, aplicacion, carenciaDias,
 *              residuo, estado }
 *              estado: mismo vocabulario que Evento, aplicado al residuo
 *              medido frente al limite maximo (LMR). 'ok' y 'warn' se pintan
 *              como marca de conformidad; 'alert' (por encima del LMR) se
 *              pinta como aspa, ver Arandano.jsx.
 *              Tres por lote: es lo que cabe en el panel de #quimicos sin
 *              que el viewport lo recorte en un movil.
 * `clamshell` es el numero impreso en la tarrina que tiene el consumidor
 * delante; `codigo` es el lote al que pertenece. Muchos clamshells comparten
 * lote, asi que en la API real este sera el dato que llegue en el QR.
 * Evento { id, etapa, titulo, fecha, lugar, responsable, detalle, tempC, estado }
 * estado: 'ok' | 'warn' | 'alert'
 */

export const ETAPAS = [
  { id: 'campo', nombre: 'Campo', descripcion: 'Cosecha manual en fundo certificado' },
  { id: 'acopio', nombre: 'Acopio', descripcion: 'Recepción y control de calidad en planta' },
  { id: 'packing', nombre: 'Packing', descripcion: 'Selección, calibrado y envasado' },
  { id: 'frio', nombre: 'Cadena de frío', descripcion: 'Preenfriado y cámara a 0-2 °C' },
  { id: 'transporte', nombre: 'Transporte', descripcion: 'Traslado refrigerado a puerto' },
  { id: 'destino', nombre: 'Destino', descripcion: 'Exportación y llegada al punto de venta' },
];

export const LOTES = [
  {
    codigo: 'ZH-2026-0412',
    clamshell: 'CL-0412-08871',
    variedad: 'Ventura',
    productor: 'Agrícola Zhenda S.A.C.',
    fundo: 'Fundo Santa Rosa',
    ubicacion: 'Villacurí, Ica, Perú',
    hectareas: 18.5,
    fechaCosecha: '2026-07-28',
    calibre: '18 - 20 mm',
    brix: 13.4,
    certificaciones: ['GlobalG.A.P.', 'HACCP', 'Grasp'],
    cosechador: { nombre: 'Rosa Huamán', cuadrilla: 'Cuadrilla 07', campanas: 6 },
    pesticidas: [
      {
        id: 'q1',
        nombre: 'Bacillus thuringiensis',
        tipo: 'Biológico',
        objetivo: 'Larva de lepidóptero',
        aplicacion: '2026-06-12',
        carenciaDias: 0,
        residuo: 'No detectado',
        estado: 'ok',
      },
      {
        id: 'q2',
        nombre: 'Azufre micronizado',
        tipo: 'Contacto',
        objetivo: 'Oídio',
        aplicacion: '2026-06-28',
        carenciaDias: 3,
        residuo: '0.4 mg/kg · LMR 50',
        estado: 'ok',
      },
      {
        id: 'q3',
        nombre: 'Abamectina',
        tipo: 'Sistémico',
        objetivo: 'Ácaro rojo',
        aplicacion: '2026-05-30',
        carenciaDias: 14,
        residuo: '0.03 mg/kg · LMR 0.05',
        estado: 'warn',
      },
    ],
    destino: 'Rotterdam, Países Bajos',
    eventos: [
      {
        id: 'e1',
        etapa: 'campo',
        titulo: 'Cosecha manual',
        fecha: '2026-07-28T06:20:00',
        lugar: 'Fundo Santa Rosa, cuartel B-4',
        responsable: 'Cuadrilla 07',
        detalle: 'Cosecha en fresco al amanecer para conservar firmeza.',
        tempC: 17,
        estado: 'ok',
      },
      {
        id: 'e2',
        etapa: 'acopio',
        titulo: 'Recepcion en planta',
        fecha: '2026-07-28T09:05:00',
        lugar: 'Planta Villacurí',
        responsable: 'Control de calidad',
        detalle: 'Muestreo: 0.8% de descarte por daño mecánico.',
        tempC: 12,
        estado: 'ok',
      },
      {
        id: 'e3',
        etapa: 'packing',
        titulo: 'Calibrado y envasado',
        fecha: '2026-07-28T13:40:00',
        lugar: 'Linea 2',
        responsable: 'Turno A',
        detalle: 'Clamshell de 125 g, 12 unidades por caja.',
        tempC: 8,
        estado: 'ok',
      },
      {
        id: 'e4',
        etapa: 'frio',
        titulo: 'Preenfriado forzado',
        fecha: '2026-07-28T16:10:00',
        lugar: 'Tunel californiano 3',
        responsable: 'Camaras',
        detalle: 'Descenso a 1 °C en 4 h 20 min.',
        tempC: 1,
        estado: 'ok',
      },
      {
        id: 'e5',
        etapa: 'transporte',
        titulo: 'Salida a puerto',
        fecha: '2026-07-29T05:00:00',
        lugar: 'Ruta Ica - Callao',
        responsable: 'Transportes Andina',
        detalle: 'Contenedor reefer MSKU-7781203, atmósfera controlada.',
        tempC: 2,
        estado: 'warn',
      },
      {
        id: 'e6',
        etapa: 'destino',
        titulo: 'Embarque',
        fecha: '2026-07-30T19:30:00',
        lugar: 'Puerto del Callao',
        responsable: 'Agencia de aduanas',
        detalle: 'Nave Maersk Sentosa, ETA Rotterdam 2026-08-22.',
        tempC: 1,
        estado: 'ok',
      },
    ],
  },
  {
    codigo: 'ZH-2026-0388',
    clamshell: 'CL-0388-04426',
    variedad: 'Biloxi',
    productor: 'Agrícola Zhenda S.A.C.',
    fundo: 'Fundo Los Molinos',
    ubicacion: 'Los Molinos, Ica, Perú',
    hectareas: 24,
    fechaCosecha: '2026-07-21',
    calibre: '16 - 18 mm',
    brix: 12.1,
    certificaciones: ['GlobalG.A.P.', 'Orgánico UE'],
    cosechador: { nombre: 'Elmer Chuquipoma', cuadrilla: 'Cuadrilla 03', campanas: 4 },
    pesticidas: [
      {
        id: 'q1',
        nombre: 'Bacillus thuringiensis',
        tipo: 'Biológico',
        objetivo: 'Larva de lepidóptero',
        aplicacion: '2026-06-05',
        carenciaDias: 0,
        residuo: 'No detectado',
        estado: 'ok',
      },
      {
        id: 'q2',
        nombre: 'Aceite de neem',
        tipo: 'Botánico',
        objetivo: 'Pulgón',
        aplicacion: '2026-06-19',
        carenciaDias: 0,
        residuo: 'No detectado',
        estado: 'ok',
      },
      {
        id: 'q3',
        nombre: 'Trichoderma harzianum',
        tipo: 'Biológico',
        objetivo: 'Botritis',
        aplicacion: '2026-05-28',
        carenciaDias: 0,
        residuo: 'No detectado',
        estado: 'ok',
      },
    ],
    destino: 'Miami, Estados Unidos',
    eventos: [
      {
        id: 'e1',
        etapa: 'campo',
        titulo: 'Cosecha manual',
        fecha: '2026-07-21T05:50:00',
        lugar: 'Fundo Los Molinos, cuartel A-1',
        responsable: 'Cuadrilla 03',
        detalle: 'Lote orgánico, sin aplicación de síntesis química.',
        tempC: 19,
        estado: 'ok',
      },
      {
        id: 'e2',
        etapa: 'packing',
        titulo: 'Envasado orgánico',
        fecha: '2026-07-21T12:15:00',
        lugar: 'Planta Ica, línea orgánica',
        responsable: 'Turno B',
        detalle: 'Línea segregada con certificación orgánica vigente.',
        tempC: 9,
        estado: 'ok',
      },
      {
        id: 'e3',
        etapa: 'frio',
        titulo: 'Cámara de conservación',
        fecha: '2026-07-21T18:00:00',
        lugar: 'Cámara 5',
        responsable: 'Camaras',
        detalle: 'Mantenido a 0.5 °C durante 36 h.',
        tempC: 0.5,
        estado: 'ok',
      },
      {
        id: 'e4',
        etapa: 'destino',
        titulo: 'Despacho aéreo',
        fecha: '2026-07-23T22:40:00',
        lugar: 'Aeropuerto Jorge Chávez',
        responsable: 'Carga aérea',
        detalle: 'Vuelo directo a Miami, 8 pallets.',
        tempC: 2,
        estado: 'ok',
      },
    ],
  },
];

export function buscarLote(codigo) {
  if (!codigo) return null;
  const clave = codigo.trim().toUpperCase();
  return LOTES.find((lote) => lote.codigo.toUpperCase() === clave) ?? null;
}

/** Busca por el numero impreso en la tarrina, no por el lote. */
export function buscarPorClamshell(clamshell) {
  if (!clamshell) return null;
  const clave = clamshell.trim().toUpperCase();
  return LOTES.find((lote) => lote.clamshell.toUpperCase() === clave) ?? null;
}

export function etapaPorId(id) {
  return ETAPAS.find((etapa) => etapa.id === id) ?? null;
}
