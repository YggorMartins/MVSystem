export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});
export const money = (value: string | number) => currency.format(Number(value));
export const quantity = (value: string | number) =>
  Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
