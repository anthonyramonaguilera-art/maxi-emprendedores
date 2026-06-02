import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { logrosDesbloqueados, desbloquearLogro } from '../store/logrosStore';
import { rachasStore } from '../store/rachaStore';
import { supabase } from '../lib/supabase';

export default function useLogros(userId) {
  const rachas = useStore(rachasStore);

  useEffect(() => {
    if (!userId) return;

    const verificarLogros = async () => {
      try {
        // Verificar primera venta
        const { count: countVentas } = await supabase
          .from('ventas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (countVentas > 0) desbloquearLogro('primera_venta');

        // Verificar primera receta
        const { count: countRecetas } = await supabase
          .from('recetas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (countRecetas > 0) desbloquearLogro('primera_receta');

        // Verificar rachas
        const rachaVentas = rachas?.ventas?.racha || 0;
        if (rachaVentas === 3) desbloquearLogro('racha_3');
        if (rachaVentas === 7) desbloquearLogro('racha_7');
        if (rachaVentas === 14) desbloquearLogro('racha_14');
        if (rachaVentas === 30) desbloquearLogro('racha_30');
      } catch (err) {
        console.error('Error verificando logros:', err);
      }
    };

    verificarLogros();
  }, [userId, rachas]);
}