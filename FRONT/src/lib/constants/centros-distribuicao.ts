export const CENTROS_DISTRIBUICAO = [
  { value: "1001", label: "Mafra - RPO (SP)" },
  { value: "1002", label: "Mafra - LDA (PR)" },
  { value: "1003", label: "Mafra - CTL (GO)" },
  { value: "1006", label: "Mafra - CAJ (SP" },
  { value: "1009", label: "Mafra - DF (DF)" },
  { value: "1010", label: "Mafra - REC (PE)"},
  { value: "1013", label: "ARP - SC (SC)" },
  { value: "1015", label: "Mafra - ES (ES)" },
  { value: "1021", label: "Mafra - NSR (RS)"},
  { value: "1023", label: "Mafra - RJ (RJ)" },
  { value: "1024", label: "Mafra - RN (RN)" },
  { value: "1026", label: "ARP - SP (SP)" },
  { value: "1028", label: "ARP - CTL (GO)" },
  { value: "1029", label: "ARP - RN (RN)" },
  { value: "1030", label: "ARP - GO (GO)" },
  { value: "1031", label: "ARP - PR (PR)" },
  { value: "1032", label: "ARP - RJ (RJ)" },
  { value: "1036", label: "Mafra - DF2 (DF)"},
  { value: "1039", label: "ARP - CTL2 (GO)"},
  { value: "9001", label: "ARP - SP (SP)" },
  { value: "9002", label: "ARP - LDA (PR" },
  { value: "9006", label: "ARP - CAJ (SP" },
  { value: "9015", label: "ARP - ES (ES)" },
  { value: "9021", label: "ARP - NSR (RS)"},
  { value: "9023", label: "ARP - RJ (RJ)" },
  { value: "9024", label: "ARP - RN (RN)" },
  { value: "9036", label: "ARP - DF2 (GO)"},
] as const;

export type CentroDistribuicao =
  (typeof CENTROS_DISTRIBUICAO)[number]["value"];

export const CENTROS_VALUES = CENTROS_DISTRIBUICAO.map((cd) => cd.value);
