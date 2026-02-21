import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import type { ComponentProps } from 'react';
import { getApiBaseUrl } from '@/lib/api';

const API_BASE = getApiBaseUrl();

// Dynamic import to handle Vite module resolution
let ReactQuill: any = null;
let ImageResize: any = null;
let Quill: any = null;

const loadReactQuill = async () => {
  if (ReactQuill && ImageResize && Quill) return { ReactQuill, ImageResize, Quill };
  
  const module = await import('react-quill');
  await import('quill/dist/quill.snow.css');
  
  // Get Quill instance
  Quill = module.default.Quill || (window as any).Quill;
  
  // Import and register image resize module
  try {
    const imageResizeModule = await import('quill-image-resize-module-react');
    ImageResize = imageResizeModule.default;
    
    // Register the module with Quill if not already registered
    if (Quill && !Quill.imports['modules/imageResize']) {
      Quill.register('modules/imageResize', ImageResize);
      console.log('✅ Image resize module registered successfully');
    }
  } catch (error) {
    console.error('❌ Failed to load image resize module:', error);
  }

  ReactQuill = module.default;
  return { ReactQuill, ImageResize, Quill };
};

// Upload image to server and return URL
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    console.log('📤 Uploading inline image:', file.name, file.size, 'bytes');

    const response = await fetch(`${API_BASE}/admin/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    
    // Build full URL
    let imageUrl = data.url;
    if (!imageUrl.startsWith('http')) {
      const origin = new URL(API_BASE).origin;
      if (!imageUrl.startsWith('/')) imageUrl = '/' + imageUrl;
      imageUrl = origin + imageUrl;
    }

    console.log('✅ Inline image uploaded:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('❌ Failed to upload inline image:', error);
    return null;
  }
};

// Convert base64 to File object
const base64ToFile = (base64: string, filename: string): File | null => {
  try {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    const ext = mime.split('/')[1] || 'png';
    return new File([u8arr], `${filename}.${ext}`, { type: mime });
  } catch (error) {
    console.error('Failed to convert base64 to file:', error);
    return null;
  }
};

interface ReactQuillEditorProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  theme?: string;
  modules?: any;
  formats?: string[];
  placeholder?: string;
}

export const ReactQuillEditor = forwardRef<any, ReactQuillEditorProps>(({ value, onChange, theme = 'snow', modules, formats, placeholder, ...props }, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [QuillComponent, setQuillComponent] = useState<any>(null);
  const quillRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
  }));

  // Custom image handler - opens file picker and uploads image
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      // Show loading placeholder
      const range = editor.getSelection(true);
      editor.insertText(range.index, 'Uploading image...', { italic: true, color: '#888' });

      const imageUrl = await uploadImage(file);
      
      // Remove loading placeholder
      editor.deleteText(range.index, 'Uploading image...'.length);

      if (imageUrl) {
        editor.insertEmbed(range.index, 'image', imageUrl);
        editor.setSelection(range.index + 1);
      } else {
        alert('Failed to upload image. Please try again.');
      }
    };
  }, []);

  // Process content to upload any base64 images
  const processBase64Images = useCallback(async (content: string): Promise<string> => {
    // Find all base64 images in content
    const base64Regex = /<img[^>]+src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g;
    const matches = [...content.matchAll(base64Regex)];
    
    if (matches.length === 0) return content;

    console.log(`📷 Found ${matches.length} base64 image(s) to upload`);
    
    let processedContent = content;
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const base64Data = match[1];
      const fullImgTag = match[0];
      
      // Convert base64 to file and upload
      const file = base64ToFile(base64Data, `pasted-image-${Date.now()}-${i}`);
      if (!file) continue;

      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        // Replace base64 src with uploaded URL, preserving other attributes
        const newImgTag = fullImgTag.replace(base64Data, imageUrl);
        processedContent = processedContent.replace(fullImgTag, newImgTag);
        console.log(`✅ Replaced base64 image ${i + 1} with uploaded URL`);
      }
    }
    
    return processedContent;
  }, []);

  useEffect(() => {
    loadReactQuill().then(({ ReactQuill }) => {
      setQuillComponent(() => ReactQuill);
      setIsLoaded(true);
    });
  }, []);

  // Setup custom handlers after editor is mounted
  useEffect(() => {
    if (!isLoaded || !quillRef.current) return;

    const editor = quillRef.current.getEditor();
    if (!editor) return;

    // Override the default image handler
    const toolbar = editor.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('image', imageHandler);
    }

    // Handle paste events to intercept base64 images
    editor.root.addEventListener('paste', async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Check if there's an image in clipboard
      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          e.stopPropagation();

          const file = item.getAsFile();
          if (!file) continue;

          const range = editor.getSelection(true);
          
          // Upload the image
          const imageUrl = await uploadImage(file);
          if (imageUrl) {
            editor.insertEmbed(range.index, 'image', imageUrl);
            editor.setSelection(range.index + 1);
          }
          return;
        }
      }
    });
  }, [isLoaded, imageHandler]);

  // Memoize the onChange handler - process base64 images before calling onChange
  const handleChange = useCallback(async (content: string, delta: any, source: string, editor: any) => {
    // Check if content contains base64 images and process them
    if (content.includes('data:image/') && content.includes('base64')) {
      const processedContent = await processBase64Images(content);
      if (processedContent !== content) {
        // Update editor with processed content
        const quillEditor = quillRef.current?.getEditor();
        if (quillEditor) {
          const selection = quillEditor.getSelection();
          quillEditor.clipboard.dangerouslyPasteHTML(processedContent);
          if (selection) {
            quillEditor.setSelection(selection);
          }
        }
        onChangeRef.current(processedContent);
        return;
      }
    }
    onChangeRef.current(content);
  }, [processBase64Images]);

  if (!isLoaded || !QuillComponent) {
    return (
      <div className="border rounded-md p-4 min-h-[200px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <QuillComponent
      ref={quillRef}
      theme={theme}
      value={value}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      {...props}
    />
  );
});

ReactQuillEditor.displayName = 'ReactQuillEditor';


