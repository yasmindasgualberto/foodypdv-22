
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type HeaderProps = {
  title: string;
  subtitle?: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  
  const handleNotification = () => {
    toast({
      title: "Notificação",
      description: "Você tem novas notificações",
    });
  };

  return (
    <header className="bg-background py-4 px-6 flex items-center justify-between border-b">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNotification}
          className="relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
          </svg>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pdv-accent rounded-full"></span>
        </Button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm hidden md:inline-block">
            {profile?.nome || 'Usuário'}
          </span>
          <Button variant="outline" size="icon" onClick={() => signOut()}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
}
