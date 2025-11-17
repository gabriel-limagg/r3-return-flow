import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "A Devolver":
        return "bg-destructive text-destructive-foreground";
      case "Em processo de devolução":
        return "bg-warning text-warning-foreground";
      case "Devolvido":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge className={getStatusColor()}>
      {status}
    </Badge>
  );
}
