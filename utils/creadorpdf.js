// utils/creadorpdf.js
const PdfPrinter = require('pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts.js');
const fs = require('fs');
const path = require('path');
const config = require('./Environment');

// --- Función auxiliar para normalizar texto ---
function normalizarTexto(texto) {
  if (!texto || typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Buscar sucursal por dirección ---
function obtenerSucursalPorDireccion(texto) {
  const textoNormalizado = normalizarTexto(texto);
  const sucursalesConfig = config.sucursales || {};

  for (const [nombreSucursal, direccionConfigurada] of Object.entries(sucursalesConfig)) {
    const dirConfigNorm = normalizarTexto(direccionConfigurada);
    const partes = dirConfigNorm.split(",");
    const aliasCorto = partes.length >= 2 ? `${partes[0]}, ${partes[1].trim()}` : dirConfigNorm;
    const primerFragmento = partes[0].trim();

    if (textoNormalizado.includes(primerFragmento) || textoNormalizado.includes(aliasCorto)) {
      return nombreSucursal;
    }
  }
  return "Desconocida";
}

// --- Función principal ---
async function generarReportePDF({
  sucursalesEvaluadas = [],
  sucursalesSinDias = [],
  fechaHora = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
  totalSucursales = 0,
  totalConfiguradas = 0,
  totalNoConfiguradas = 0
}) {
  try {
    // --- Definición de fuentes ---
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    const printer = new PdfPrinter(fonts);
    printer.vfs = vfsFonts.vfs;

    // --- Contenido del resumen ---
    const contenidoResumen = [
      { text: 'Resumen Final', style: 'titulo' },
      { text: `Fecha ejecución: ${fechaHora}`, style: 'subtitulo' },
      { text: '\n' },
      { text: `Total de sucursales evaluadas: ${totalSucursales}`, style: 'texto' },
      { text: `Total configuradas con días: ${totalConfiguradas}`, style: 'texto' },
      { text: `Total sin días configurados: ${totalNoConfiguradas}\n\n`, style: 'texto' },
      { text: 'Sucursales sin días configurados', style: 'encabezadoNaranja' }
    ];

    if (sucursalesSinDias.length > 0) {
      sucursalesSinDias.forEach(nombre => contenidoResumen.push({ text: nombre, style: 'texto' }));
    } else {
      contenidoResumen.push({ text: 'Todas las sucursales se encuentran configuradas.', style: 'texto' });
    }

    contenidoResumen.push({ text: '', pageBreak: 'after' });

    // --- Detalle de sucursales ---
    const sucursalesConDias = sucursalesEvaluadas.filter(s => Array.isArray(s.dias) && s.dias.length > 0);
    const contenidoDetalle = [];

    for (const [index, s] of sucursalesConDias.entries()) {
      const nombreDetectado = obtenerSucursalPorDireccion(s.nombre);

      contenidoDetalle.push({
        text: `Sucursal: ${nombreDetectado}`,
        style: 'encabezadoSucursal'
      });

      // Dirección con fuente más grande e interlineado
      contenidoDetalle.push({
        text: [
          { text: 'Dirección: ', color: '#ff8800', bold: true },
          { text: s.nombre, color: '#000000' }
        ],
        style: 'direccion'
      });

      contenidoDetalle.push({ text: '\n', style: 'texto' });

      // --- Construcción de tabla Día 1 a Día 4 ---
      const dias = s.dias.slice(0, 4); // máximo 4 días
      const columnas = ['Día 1', 'Día 2', 'Día 3', 'Día 4'];

      // Normalizar y limpiar horarios: split por "," + trim + eliminar "." final
      const diasData = columnas.map((_, i) => {
        let d = dias[i] || { nombreDia: '', horarios: [] };
        if (typeof d.horarios === 'string') {
          d.horarios = d.horarios
            .split(',')
            .map(h => h.trim().replace(/\.$/, ''))
            .filter(h => h.length > 0);
        } else if (!Array.isArray(d.horarios)) {
          d.horarios = [];
        }
        return d;
      });

      // Calcular máximo número de filas
      const maxFilas = Math.max(...diasData.map(d => d.horarios.length));

      // Encabezado de tabla
      contenidoDetalle.push({
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            columnas.map(c => ({
              text: c,
              style: 'encabezadoNaranja',
              alignment: 'center',
              fillColor: '#ffe6cc'
            }))
          ]
        },
        layout: 'lightHorizontalLines'
      });

      // Filas de horarios con fondo alternado
      const bodyHorarios = [];
      for (let i = 0; i < maxFilas; i++) {
        const fila = diasData.map(d => ({
          text: d.horarios[i] || '',
          alignment: 'left',
          style: 'texto',
          fillColor: i % 2 === 0 ? '#ffffff' : '#f2f2f2' // alternado blanco/gris
        }));
        bodyHorarios.push(fila);
      }

      contenidoDetalle.push({
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: bodyHorarios
        },
        layout: 'lightHorizontalLines'
      });

      contenidoDetalle.push({ text: '\n', style: 'texto' });

      if (index < sucursalesConDias.length - 1) {
        contenidoDetalle.push({ text: '', pageBreak: 'after' });
      }
    }

    // --- Documento PDF ---
    const docDefinition = {
      content: [...contenidoResumen, ...contenidoDetalle],
      styles: {
        titulo: { fontSize: 18, bold: true, color: '#ff8800', margin: [0,0,0,10] },
        subtitulo: { fontSize: 12, italics: true, color: '#555', margin: [0,0,0,15] },
        texto: { fontSize: 11, margin: [0,2,0,2] },
        encabezadoNaranja: { fontSize: 13, bold: true, color: '#ff8800', margin: [0,10,0,5] },
        encabezadoSucursal: { fontSize: 14, bold: true, color: '#ff6600', margin: [0,12,0,8] },
        direccion: { fontSize: 12, lineHeight: 1.4, margin: [0,4,0,4] }
      },
      defaultStyle: { font: 'Roboto' },
      pageMargins: [40, 60, 40, 60]
    };

    // --- Guardado ---
    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    const pdfPath = path.join(reportDir, 'reporteSucursales.pdf');

    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(pdfPath);
    pdfDoc.pipe(stream);
    pdfDoc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log(`📄 Reporte PDF generado en: ${pdfPath}`);
        resolve(pdfPath);
      });
      stream.on('error', reject);
    });

  } catch (err) {
    console.error('❌ Error al generar PDF:', err);
    throw err;
  }
}

module.exports = { generarReportePDF };
