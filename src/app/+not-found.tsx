import { ThemedStatusBar } from '@/components/app-status-bar';
import { ScreenMessage } from '@/components/screen-message';
import { goBackOrHome } from '@/utils/navigation';

export default function NotFoundScreen() {
  return (
    <>
      <ThemedStatusBar />
      <ScreenMessage
        icon="explore-off"
        title="Tela não encontrada"
        description="O caminho que você abriu não existe na Luly."
        actionLabel="VOLTAR"
        onAction={goBackOrHome}
      />
    </>
  );
}
