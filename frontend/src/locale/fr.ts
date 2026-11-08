import { addLocale } from "primereact/api";

export const frLocale = {
  firstDayOfWeek: 1,
  dayNames: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  dayNamesShort: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  dayNamesMin: ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"],
  monthNames: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ],
  monthNamesShort: [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Aoû",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ],
  today: "Aujourd'hui",
  clear: "Effacer",
  emptyMessage: "Aucun résultat trouvé",
  emptyFilterMessage: "Aucun résultat trouvé",
};

export function registerFrenchLocale(): void {
  addLocale("fr", frLocale);
}
