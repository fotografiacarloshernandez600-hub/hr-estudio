// ============================================================
// SCHEMAS PARA AGREGAR A TU SANITY STUDIO
// ============================================================
// Copia estos schemas en la carpeta de schemas de tu proyecto
// de Sanity Studio y regístralos en tu schema index.
// ============================================================

// 1. NUEVO TIPO: testimonio
// Crea un archivo testimonio.js con esto:
export const testimonio = {
  name: 'testimonio',
  title: 'Testimonios',
  type: 'document',
  fields: [
    {
      name: 'nombre',
      title: 'Nombre del cliente',
      type: 'string',
      description: 'Ej: Familia Pérez, Ana y Luis...',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'evento',
      title: 'Tipo de evento',
      type: 'string',
      description: 'Ej: Boda, XV años, Bautizo...',
    },
    {
      name: 'texto',
      title: 'Testimonio',
      type: 'text',
      rows: 4,
      description: 'Lo que dijo el cliente (corto, 1-3 frases funciona mejor)',
      validation: (Rule) => Rule.required().max(280),
    },
  ],
  preview: {
    select: { title: 'nombre', subtitle: 'evento' },
  },
};

// 2. CAMPO NUEVO PARA EL TIPO "sesion" EXISTENTE
// Agrega este campo dentro de fields[] de tu schema "sesion".
// La página lo usa para los filtros del portafolio
// (si una sesión no tiene categoría, usa el municipio como filtro):
export const campoCategoria = {
  name: 'categoria',
  title: 'Categoría',
  type: 'string',
  description: 'Para filtrar el portafolio en la página principal',
  options: {
    list: [
      { title: 'Bodas', value: 'Bodas' },
      { title: 'XV años', value: 'XV años' },
      { title: 'Bautizos', value: 'Bautizos' },
      { title: 'Eventos sociales', value: 'Eventos sociales' },
      { title: 'Carreras atléticas', value: 'Carreras atléticas' },
      { title: 'Drone', value: 'Drone' },
      { title: 'Producto', value: 'Producto' },
      { title: 'Retrato', value: 'Retrato' },
    ],
  },
};
