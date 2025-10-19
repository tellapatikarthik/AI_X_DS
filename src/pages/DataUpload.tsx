import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileSpreadsheet, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DataUpload = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!datasetName) {
        setDatasetName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { columns: [], rowCount: 0 };
    
    const headers = lines[0].split(',').map(h => h.trim());
    return {
      columns: headers.map(name => ({ name, type: 'text' })),
      rowCount: lines.length - 1
    };
  };

  const handleUpload = async () => {
    if (!file || !user || !datasetName) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Parse file content for metadata
      const text = await file.text();
      const { columns, rowCount } = parseCSV(text);

      // Create dataset record
      const { error: dbError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: datasetName,
          description,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          columns_schema: columns,
          row_count: rowCount
        });

      if (dbError) throw dbError;

      toast.success("Dataset uploaded successfully!");
      navigate("/data");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Upload Dataset
          </h1>
          <p className="text-muted-foreground">Import your data to start analyzing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 shadow-md border-0">
            <h2 className="text-2xl font-semibold mb-6">Dataset Information</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Data File *</Label>
                <div className="mt-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
                {file && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="name">Dataset Name *</Label>
                <Input
                  id="name"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  placeholder="My Dataset"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your dataset..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={loading || !file || !datasetName}
                variant="hero"
                className="w-full mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Dataset
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 shadow-md border-0 bg-muted/30">
            <h2 className="text-2xl font-semibold mb-4">Supported Formats</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold">CSV Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Comma-separated values with headers in first row
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-accent mt-1" />
                <div>
                  <h3 className="font-semibold">Excel Files</h3>
                  <p className="text-sm text-muted-foreground">
                    .xlsx and .xls formats supported
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <h3 className="font-semibold mb-2">Tips for best results:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Include column headers in the first row</li>
                <li>• Keep file size under 50MB</li>
                <li>• Use consistent data formats</li>
                <li>• Remove empty rows/columns</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DataUpload;
