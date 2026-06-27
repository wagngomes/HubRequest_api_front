import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "PROCESSADA") {
    return (
      <Badge variant="success" className="font-medium">
        ✓ Processada
      </Badge>
    );
  }
  if (status === "NAO_PROCESSADA") {
    return (
      <Badge variant="destructive" className="font-medium">
        ✗ Não Processada
      </Badge>
    );
  }
  return (
    <Badge variant="warning" className="font-medium">
      ⏳ Pendente
    </Badge>
  );
}

interface RetornoBadgeProps {
  retorno?: string | null;
}

export function RetornoBadge({ retorno }: RetornoBadgeProps) {
  if (!retorno) {
    return (
      <Badge variant="outline" className="font-medium text-gray-500">
        Aguardando
      </Badge>
    );
  }
  if (retorno === "APROVADA") {
    return (
      <Badge variant="success" className="font-medium">
        ✓ Aprovada
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="font-medium">
      ✗ Reprovada
    </Badge>
  );
}
