import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [departments, setDepartments] = useState(['IT', 'Operations', 'Finance', 'HR', 'Marketing']);
  const [thresholds, setThresholds] = useState({
    IT: 100000,
    Operations: 75000,
    Finance: 50000,
    HR: 25000,
    Marketing: 50000
  });
  const [tags, setTags] = useState(['software', 'hardware', 'consulting', 'recurring', 'urgent']);
  const [newDepartment, setNewDepartment] = useState('');
  const [newTag, setNewTag] = useState('');

  const { toast } = useToast();

  const addDepartment = () => {
    if (newDepartment && !departments.includes(newDepartment)) {
      setDepartments([...departments, newDepartment]);
      setThresholds(prev => ({ ...prev, [newDepartment]: 50000 }));
      setNewDepartment('');
    }
  };

  const removeDepartment = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
    const newThresholds = { ...thresholds };
    delete newThresholds[dept];
    setThresholds(newThresholds);
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const saveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure system preferences and approval workflows</p>
        </div>
        <Button onClick={saveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="thresholds">Approval Thresholds</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Department Management</CardTitle>
              <CardDescription>Manage organizational departments for invoice categorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new department"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                />
                <Button onClick={addDepartment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {departments.map(dept => (
                  <Badge key={dept} variant="outline" className="px-3 py-1">
                    {dept}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-4 w-4 p-0"
                      onClick={() => removeDepartment(dept)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle>Approval Thresholds</CardTitle>
              <CardDescription>Set department-wise approval limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {departments.map(dept => (
                <div key={dept} className="flex items-center justify-between">
                  <Label className="font-medium">{dept}</Label>
                  <div className="flex items-center gap-2">
                    <span>₹</span>
                    <Input
                      type="number"
                      value={thresholds[dept] || 0}
                      onChange={(e) => setThresholds(prev => ({
                        ...prev,
                        [dept]: parseInt(e.target.value) || 0
                      }))}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Tags</CardTitle>
              <CardDescription>Manage tags for invoice categorization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                />
                <Button onClick={addTag}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-4 w-4 p-0"
                      onClick={() => removeTag(tag)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}