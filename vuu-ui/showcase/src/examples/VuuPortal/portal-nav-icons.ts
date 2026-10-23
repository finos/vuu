/* Outline icons (24px, 1.6 stroke) from the PortalNav design mock. */

const svgIcon = (body: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  )}`;

export const workspaceIcon = svgIcon(
  '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="10" width="8" height="11" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/>',
);
export const watchlistIcon = svgIcon(
  '<path d="M4 6h9M4 12h9M4 18h9"/><path d="M16 9.5l2.5-2.5L21 9.5"/><path d="M16 14.5l2.5 2.5 2.5-2.5"/>',
);
export const ordersIcon = svgIcon(
  '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
);
export const executionsIcon = svgIcon(
  '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 12.2l2.4 2.4 4.6-5"/>',
);
export const priceLadderIcon = svgIcon(
  '<path d="M7 3v18M17 3v18M7 7h10M7 11h10M7 15h10M7 19h10"/>',
);
export const marketDepthIcon = svgIcon(
  '<path d="M3 20h18"/><path d="M3 17h3v-3h3v-3h3"/><path d="M21 17h-3v-4h-3v-3h-3"/>',
);
export const timeAndSalesIcon = svgIcon(
  '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
);
export const positionsIcon = svgIcon(
  '<path d="M12 3l8 4.5-8 4.5-8-4.5z"/><path d="M4 12l8 4.5 8-4.5"/><path d="M4 16.5L12 21l8-4.5"/>',
);
export const pnlIcon = svgIcon(
  '<path d="M3 20h18"/><path d="M4 15l5-5 4 3 7-7"/><path d="M15 6h5v5"/>',
);
export const exposureIcon = svgIcon(
  '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M12 12h9M3 9h9"/>',
);
export const executionQualityIcon = svgIcon(
  '<circle cx="7" cy="16" r="1.3"/><circle cx="11" cy="10" r="1.3"/><circle cx="15" cy="14" r="1.3"/><circle cx="18" cy="7" r="1.3"/><path d="M3 4v17h18"/>',
);
export const deskOverviewIcon = svgIcon(
  '<path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
);
export const chartIcon = svgIcon(
  '<path d="M3 20h18"/><path d="M7 6v11M12 4v12M17 8v9"/><rect x="5.5" y="9" width="3" height="5" rx=".5"/><rect x="10.5" y="7" width="3" height="6" rx=".5"/><rect x="15.5" y="10" width="3" height="4" rx=".5"/>',
);
export const depthChartIcon = svgIcon(
  '<path d="M3 20h18"/><path d="M3 8c3 0 4 4 6 7s2 2 3 2"/><path d="M21 8c-3 0-4 4-6 7s-2 2-3 2"/>',
);
