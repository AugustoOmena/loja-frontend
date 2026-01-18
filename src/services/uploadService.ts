import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente Supabase apenas para Storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadService = {
  uploadImage: async (file: File): Promise<string> => {
    // 1. Cria um nome único para o arquivo (evita conflitos)
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // 2. Faz o upload para o bucket 'product-images'
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error('Erro ao fazer upload da imagem');
    }

    // 3. Pega a URL pública
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};