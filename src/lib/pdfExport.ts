import html2canvas from "html2canvas";

export async function exportDashboardToPDF(elementId: string, title: string = "MCPM Simulation Report") {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Dashboard element not found");

  const canvas = await html2canvas(el, {
    backgroundColor: "#0a0d12",
    scale: 2,
    useCORS: true,
    logging: false,
  });

  // Create a printable page with the canvas
  const imgData = canvas.toDataURL("image/png");
  const printWindow = window.open("", "_blank");
  if (!printWindow) throw new Error("Popup blocked");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { margin: 0; padding: 20px; background: #0a0d12; display: flex; flex-direction: column; align-items: center; }
          h1 { font-family: monospace; color: #4ade80; font-size: 14px; margin-bottom: 10px; }
          p { font-family: monospace; color: #666; font-size: 10px; margin-bottom: 20px; }
          img { max-width: 100%; height: auto; }
          @media print { body { background: white; } h1 { color: #333; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated ${new Date().toLocaleString()}</p>
        <img src="${imgData}" />
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
