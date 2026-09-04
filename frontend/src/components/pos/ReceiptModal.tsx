import { Printer, ReceiptText } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { dateTime, money, quantity } from "../../lib/format";
import type { FiscalDocument, Sale } from "../../types";
export function ReceiptModal({
  sale,
  canFiscal,
  onClose,
  onFiscal,
}: {
  sale: Sale | null;
  canFiscal: boolean;
  onClose(): void;
  onFiscal(): Promise<void>;
}) {
  if (!sale) return null;
  return (
    <Modal open title={`Venda #${sale.id}`} onClose={onClose}>
      <div className="thermal-receipt" id="sale-receipt">
        <header>
          <strong>Mercadinho da Vizinha</strong>
          <span>COMPROVANTE NÃO FISCAL</span>
          <small>{dateTime.format(new Date(sale.createdAt))}</small>
        </header>
        {sale.items?.map((item) => (
          <div className="receipt-item" key={item.id}>
            <span>{item.product?.name ?? `Produto #${item.productId}`}</span>
            <small>
              {quantity(item.quantity)} × {money(item.unitPrice ?? item.product?.price ?? 0)}
            </small>
            <strong>
              {money(Number(item.quantity) * Number(item.unitPrice ?? item.product?.price ?? 0))}
            </strong>
          </div>
        ))}
        <footer>
          <span>Total</span>
          <strong>{money(sale.totalAmount)}</strong>
          <small>Pagamento: {sale.paymentMethod.replaceAll("_", " ")}</small>
          {sale.fiscalDocument && <FiscalBlock document={sale.fiscalDocument} />}
        </footer>
      </div>
      <div className="modal-actions no-print">
        {canFiscal && (
          <Button variant="secondary" onClick={onFiscal} icon={<ReceiptText />}>
            Simular NFC-e
          </Button>
        )}
        <Button onClick={() => window.print()} icon={<Printer />}>
          Imprimir comprovante
        </Button>
      </div>
    </Modal>
  );
}
function FiscalBlock({ document }: { document: FiscalDocument }) {
  return (
    <div className="fiscal-simulation">
      <b>SEM VALIDADE FISCAL — SIMULAÇÃO</b>
      <small>Chave: {document.accessKey}</small>
      <small>Protocolo: {document.protocol}</small>
    </div>
  );
}
