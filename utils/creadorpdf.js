// utils/creadorpdf.js
const PdfPrinter = require('pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts.js');
const fs = require('fs');
const path = require('path');
const config = require('./Environment');


// ------------------------------------------------------
//  NORMALIZADOR DE TEXTO
// ------------------------------------------------------
function normalizarTexto(texto) {
  if (!texto || typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


// ------------------------------------------------------
//  BUSCAR SUCURSAL POR DIRECCIÓN
// ------------------------------------------------------
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


// ------------------------------------------------------
//  REPORTE DE SUCURSALES (EXISTENTE)
// ------------------------------------------------------
async function generarReportePDF({
  sucursalesEvaluadas = [],
  sucursalesSinDias = [],
  fechaHora = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
  totalSucursales = 0,
  totalConfiguradas = 0,
  totalNoConfiguradas = 0
}) {
  try {
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

    const sucursalesConDias = sucursalesEvaluadas.filter(s => Array.isArray(s.dias) && s.dias.length > 0);
    const contenidoDetalle = [];

    for (const [index, s] of sucursalesConDias.entries()) {
      const nombreDetectado = obtenerSucursalPorDireccion(s.nombre);

      contenidoDetalle.push({
        text: `Sucursal: ${nombreDetectado}`,
        style: 'encabezadoSucursal'
      });

      contenidoDetalle.push({
        text: [
          { text: 'Dirección: ', color: '#ff8800', bold: true },
          { text: s.nombre, color: '#000000' }
        ],
        style: 'direccion'
      });

      contenidoDetalle.push({ text: '\n', style: 'texto' });

      const dias = s.dias.slice(0, 4);
      const columnas = ['Día 1', 'Día 2', 'Día 3', 'Día 4'];

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

      const maxFilas = Math.max(...diasData.map(d => d.horarios.length));

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

      const bodyHorarios = [];
      for (let i = 0; i < maxFilas; i++) {
        const fila = diasData.map(d => ({
          text: d.horarios[i] || '',
          alignment: 'left',
          style: 'texto',
          fillColor: i % 2 === 0 ? '#ffffff' : '#f2f2f2'
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

    const docDefinition = {
      content: [...contenidoResumen, ...contenidoDetalle],
      styles: {
        titulo: { fontSize: 18, bold: true, color: '#ff8800', margin: [0, 0, 0, 10] },
        subtitulo: { fontSize: 12, italics: true, color: '#555', margin: [0, 0, 0, 15] },
        texto: { fontSize: 11, margin: [0, 2, 0, 2] },
        encabezadoNaranja: { fontSize: 13, bold: true, color: '#ff8800', margin: [0, 10, 0, 5] },
        encabezadoSucursal: { fontSize: 14, bold: true, color: '#ff6600', margin: [0, 12, 0, 8] },
        direccion: { fontSize: 12, lineHeight: 1.4, margin: [0, 4, 0, 4] }
      },
      defaultStyle: { font: 'Roboto' },
      pageMargins: [40, 60, 40, 60]
    };

    const reportDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    const pdfPath = path.join(reportDir, '../reports/reporteSucursales.pdf');

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



// ------------------------------------------------------
//  ⚡ NUEVO: REPORTE DE COINCIDENCIAS (C1, C2, C3, C4)
// ------------------------------------------------------
async function generarReporteCoincidenciasPDF({
  nombreTestCase = "TestCase",
  fechaEjecucion = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
  resultados = []
}) {
  try {

    // ---------------------------
    //  ADAPTADOR DE DATOS
    // ---------------------------
    const resultadosAdaptados = resultados.map(r => {
      const tieneEquivalencias = Array.isArray(r.equivalencias);

      let listaDetallada = [];

      if (Array.isArray(r.listaDetallada) && r.listaDetallada.length > 0) {
        listaDetallada = r.listaDetallada;
      } else {
        const coinc = Array.isArray(r.coincidencias) ? r.coincidencias : [];
        const noCoinc = Array.isArray(r.noCoincidencias) ? r.noCoincidencias : [];

        listaDetallada = [
          ...coinc.map(t => ({ texto: String(t), coincide: true })),
          ...noCoinc.map(t => ({ texto: String(t), coincide: false }))
        ];
      }

      return {
        termino: r.termino || r.input || "Sin nombre",
        equivalencias: r.equivalencias || null,
        productosEncontrados: Array.isArray(r.productosEncontrados) ? r.productosEncontrados : [],
        hayResultados:
          r.hayResultados === true ||
          listaDetallada.length > 0 ||
          (Array.isArray(r.productosEncontrados) && r.productosEncontrados.length > 0),
        listaDetallada
      };
    });

    if (resultadosAdaptados.length === 0) {
      throw new Error("El generador recibió un arreglo vacío.");
    }


    // ---------------------------
    // MÉTRICAS
    // ---------------------------
    const totalEvaluados = resultadosAdaptados.length;
    const tieneEquivalencias = resultadosAdaptados.some(x => Array.isArray(x.equivalencias));

    let metricas = {};

    if (tieneEquivalencias) {
      metricas.todasCorrectas = resultadosAdaptados.filter(
        x => x.listaDetallada.length > 0 && x.listaDetallada.every(y => y.coincide)
      ).length;

      metricas.conErrores = resultadosAdaptados.filter(
        x => x.listaDetallada.some(y => !y.coincide)
      ).length;

    } else {
      metricas.conResultados = resultadosAdaptados.filter(x => x.hayResultados).length;
      metricas.sinResultados = resultadosAdaptados.filter(x => !x.hayResultados).length;
    }


    // ---------------------------
    // CONFIG PDF
    // ---------------------------
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

    const contenido = [];

    // ---------------------------
    // RESUMEN GENERAL
    // ---------------------------
    contenido.push(
      { text: `Reporte Testcase: ${nombreTestCase}`, style: 'titulo', margin: [0, 0, 0, 10] },
      { text: `Fecha ejecución: ${fechaEjecucion}`, style: 'subtitulo', margin: [0, 0, 0, 15] },
      { text: `Cantidad total de términos evaluados: ${totalEvaluados}`, style: 'subtitulo', margin: [0, 0, 0, 10] }
    );

    if (tieneEquivalencias) {
      contenido.push(
        { text: `Términos con todas las equivalencias correctas: ${metricas.todasCorrectas}`, style: 'subtitulo' },
        { text: `Términos con equivalencias incorrectas: ${metricas.conErrores}`, style: 'subtitulo' }
      );
    } else {
      contenido.push(
        { text: `Términos con resultados de búsqueda: ${metricas.conResultados}`, style: 'subtitulo' },
        { text: `Términos sin resultados de búsqueda: ${metricas.sinResultados}`, style: 'subtitulo' }
      );
    }

    contenido.push({ text: "", pageBreak: "after" });


    // ---------------------------
    // DETALLE POR TÉRMINO
    // ---------------------------
    for (let i = 0; i < resultadosAdaptados.length; i++) {
      const termino = resultadosAdaptados[i];

      contenido.push({
        text: `Resultado de búsqueda: "${termino.termino}"`,
        style: 'encabezadoNaranja',
        margin: [0, 0, 0, 10]
      });

      // ---------------------------------------------------------
      //   C2 / C3 — NO HAY EQUIVALENCIAS
      // ---------------------------------------------------------
      if (!termino.equivalencias) {

        const hayProductos = termino.productosEncontrados.length > 0;

        if (!hayProductos) {
          contenido.push({ text: "Búsqueda sin éxito", style: "texto" });

          if (i < resultadosAdaptados.length - 1) {
            contenido.push({ text: "", pageBreak: "after" });
          }

          continue;
        }

        const tablaBody = [
          [
            {
              text: "Producto encontrado",
              style: "encabezadoNaranja",
              fillColor: "#ffe6cc",
              alignment: "center"
            }
          ]
        ];

        termino.productosEncontrados.forEach(p => {
          tablaBody.push([{ text: p, style: "texto", alignment: "left" }]);
        });

        contenido.push({
          table: { widths: ["100%"], body: tablaBody },
          layout: "lightHorizontalLines"
        });

        if (i < resultadosAdaptados.length - 1) {
          contenido.push({ text: "", pageBreak: "after" });
        }

        continue;
      }

      // ---------------------------------------------------------
      //   C1 / C4 — EQUIVALENCIAS
      // ---------------------------------------------------------
      const total = termino.listaDetallada.length;
      const totalCoinc = termino.listaDetallada.filter(x => x.coincide).length;

      contenido.push({
        text: `${totalCoinc} coincidencias de ${total} productos encontrados`,
        style: "subtitulo",
        margin: [0, 0, 0, 15]
      });

      const ordenados = [
        ...termino.listaDetallada.filter(x => x.coincide),
        ...termino.listaDetallada.filter(x => !x.coincide)
      ];

      const tablaBody = [
        [
          {
            text: "Producto",
            style: "encabezadoNaranja",
            alignment: "center",
            fillColor: "#ffe6cc"
          },
          {
            text: "Resultado",
            style: "encabezadoNaranja",
            alignment: "center",
            fillColor: "#ffe6cc"
          }
        ]
      ];

      ordenados.forEach(row => {
        tablaBody.push([
          { text: row.texto, style: "texto", alignment: "left" },
          row.coincide
            ? { text: "Correcto", alignment: "center", color: "green", fontSize: 11 }
            : { text: "Incorrecto", alignment: "center", color: "red", fontSize: 11 }
        ]);
      });

      contenido.push({
        table: { widths: ["80%", "20%"], body: tablaBody },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#cccccc",
          vLineColor: () => "#cccccc"
        }
      });

      if (i < resultadosAdaptados.length - 1) {
        contenido.push({ text: "", pageBreak: "after" });
      }
    }


    // ---------------------------
    // GUARDAR PDF
    // ---------------------------
    const docDefinition = {
      content: contenido,
      styles: {
        titulo: { fontSize: 18, bold: true, color: "#ff8800" },
        subtitulo: { fontSize: 12, color: "#333" },
        texto: { fontSize: 11, lineHeight: 1.1 },
        encabezadoNaranja: { fontSize: 13, bold: true, color: "#ff8800" }
      },
      defaultStyle: { font: "Roboto" },
      pageMargins: [40, 60, 40, 60]
    };

    const reportDir = path.join(__dirname, "../reports");
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    const fechaSafe = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
    const pdfName = `Reporte_${nombreTestCase}_${fechaSafe}.pdf`;

    const pdfPath = path.join(reportDir, pdfName);

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const stream = fs.createWriteStream(pdfPath);
    pdfDoc.pipe(stream);
    pdfDoc.end();

    return new Promise((resolve, reject) => {
      stream.on("finish", () => {
        console.log(`📄 Reporte generado: ${pdfPath}`);
        resolve(pdfPath);
      });
      stream.on("error", reject);
    });

  } catch (err) {
    console.error("❌ Error al generar reporte:", err);
    throw err;
  }
}

module.exports = { generarReportePDF, generarReporteCoincidenciasPDF };
