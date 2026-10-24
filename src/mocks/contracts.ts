import { format } from "date-fns";
import type { PdfLine } from "@/lib/pdf";

export interface SampleContractInput {
  landlord: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  address: string;
  city: string;
  startDate: Date;
  lastDay: Date;
  monthlyRentMAD: number;
  depositMAD: number;
  rentDueDay: number;
  rib?: string;
}

const day = (date: Date) => format(date, "dd/MM/yyyy");
const mad = (amount: number) => `${amount.toLocaleString("fr-FR")} MAD`;

/**
 * Stand-in for the signed contract PDF of the seeded leases, which have no real file behind
 * them. Moroccan residential leases are commonly drafted in French.
 */
export function sampleContractLines(input: SampleContractInput): PdfLine[] {
  return [
    { text: "CONTRAT DE BAIL À USAGE D'HABITATION", size: 16, bold: true, rule: true },
    { text: "Loi n° 67-12 relative aux baux d'habitation", size: 9, gap: 6 },
    { text: "Entre les soussignés", bold: true, gap: 18 },
    { text: `Le bailleur, représenté par son mandataire : ${input.landlord}` },
    { text: `Le locataire : ${input.tenantName}` },
    { text: "Article 1 — Objet", bold: true, gap: 16 },
    {
      text: `Le bailleur donne en location au locataire le logement « ${input.unitName} » de la résidence ${input.propertyName}, ${input.address}, ${input.city}, à usage exclusif d'habitation principale.`,
    },
    { text: "Article 2 — Durée", bold: true, gap: 16 },
    {
      text: `Le bail prend effet le ${day(input.startDate)} et prend fin le ${day(input.lastDay)}. Il peut être renouvelé d'un commun accord.`,
    },
    { text: "Article 3 — Loyer", bold: true, gap: 16 },
    {
      text: `Le loyer mensuel est fixé à ${mad(input.monthlyRentMAD)}, payable le ${input.rentDueDay} de chaque mois par virement bancaire${input.rib ? ` au RIB ${input.rib}` : ""}.`,
    },
    { text: "Article 4 — Dépôt de garantie", bold: true, gap: 16 },
    {
      text: `Le locataire verse un dépôt de garantie de ${mad(input.depositMAD)}, restitué à la sortie après état des lieux.`,
    },
    { text: `Fait à ${input.city}, le ${day(input.startDate)}`, gap: 28 },
    { text: "Le bailleur                                        Le locataire", gap: 22 },
    { text: "Exemplaire de démonstration — Velvet Keys", size: 8, gap: 120 },
  ];
}
