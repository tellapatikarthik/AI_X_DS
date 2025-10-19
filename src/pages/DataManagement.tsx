import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Trash2, Eye, Download } from "lucide-react";
import { toast } from "sonner";

const DataManagement = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
      } else {
        setUser(user);
        loadDatasets(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadDatasets(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadDatasets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDatasets(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('datasets')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success("Dataset deleted successfully");
      setDatasets(datasets.filter(d => d.id !== id));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              My Datasets
            </h1>
            <p className="text-muted-foreground">Manage your data sources</p>
          </div>
          <Link to="/upload">
            <Button variant="hero" className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Dataset
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading datasets...</p>
          </div>
        ) : datasets.length === 0 ? (
          <Card className="p-12 text-center shadow-md border-0">
            <Database className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No datasets yet</h2>
            <p className="text-muted-foreground mb-6">Upload your first dataset to get started</p>
            <Link to="/upload">
              <Button variant="hero" className="gap-2">
                <Plus className="h-4 w-4" />
                Upload Dataset
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="shadow-md border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Rows</TableHead>
                    <TableHead className="font-semibold">Columns</TableHead>
                    <TableHead className="font-semibold">Size</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {datasets.map((dataset) => (
                    <TableRow key={dataset.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{dataset.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {dataset.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dataset.row_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dataset.columns_schema?.length || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {dataset.file_size ? `${(dataset.file_size / 1024).toFixed(2)} KB` : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(dataset.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(dataset.id, dataset.file_path)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DataManagement;
