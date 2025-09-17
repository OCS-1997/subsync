import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Percent, Layers, AlertCircle, Loader2, Settings, Info, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axiosInstance.js";

const DefaultTaxRatesSection = ({ defaultTaxRates, setDefaultTaxRates }) => {
  const [taxes, setTaxes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [defaultPreferences, setDefaultPreferences] = useState({ intra: null, inter: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDefaults, setLoadingDefaults] = useState(false);

  useEffect(() => {
    fetchTaxData();
  }, []);

  // Initialize with default preferences when data is loaded
  useEffect(() => {
    if (!loading && defaultPreferences.intra && defaultPreferences.inter && 
        (!defaultTaxRates.intra.kind && !defaultTaxRates.inter.kind)) {
      loadDefaultTaxPreferences();
    }
  }, [loading, defaultPreferences]);

  const fetchTaxData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [taxesRes, groupsRes, prefsRes] = await Promise.all([
        api.get("/all-taxes"),
        api.get("/tax-groups?include=members"),
        api.get("/default-tax-preferences")
      ]);

      setTaxes(taxesRes.data.taxes || []);
      setGroups(groupsRes.data.groups || []);
      const prefs = prefsRes.data.preferences || { intra: null, inter: null };
      setDefaultPreferences(prefs);
    } catch (error) {
      console.error("Error fetching tax data:", error);
      setError("Failed to fetch tax configuration data");
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultTaxPreferences = async () => {
    if (!defaultPreferences.intra || !defaultPreferences.inter) {
      toast.warning("No default tax preferences configured. Please set them in Settings → Taxes → Default Tax Preference first.");
      return;
    }

    setLoadingDefaults(true);
    try {
      let intraRate = "0";
      let interRate = "0";

      // Handle intra-state (from tax groups)
      if (defaultPreferences.intra && defaultPreferences.intra.kind === 'group') {
        const group = groups.find(g => g.group_id === defaultPreferences.intra.id);
        if (group && group.members && group.members.length > 0) {
          intraRate = group.members.reduce((sum, member) => sum + (parseFloat(member.tax_rate) || 0), 0).toString();
        }
      } else if (defaultPreferences.intra && defaultPreferences.intra.kind === 'tax') {
        const tax = taxes.find(t => t.tax_id === defaultPreferences.intra.id);
        intraRate = tax?.tax_rate?.toString() || "0";
      }

      // Handle inter-state (from IGST taxes)
      if (defaultPreferences.inter && defaultPreferences.inter.kind === 'tax') {
        const tax = taxes.find(t => t.tax_id === defaultPreferences.inter.id);
        interRate = tax?.tax_rate?.toString() || "0";
      }

      setDefaultTaxRates({
        intra: {
          kind: defaultPreferences.intra?.kind || null,
          id: defaultPreferences.intra?.id || null,
          rate: intraRate
        },
        inter: {
          kind: defaultPreferences.inter?.kind || null,
          id: defaultPreferences.inter?.id || null,
          rate: interRate
        }
      });

    } catch (error) {
      console.error("Error loading defaults:", error);
      toast.error("Failed to load default tax preferences");
    } finally {
      setLoadingDefaults(false);
    }
  };

  const handleIntraStateChange = (value) => {
    if (value === 'none') {
      setDefaultTaxRates(prev => ({
        ...prev,
        intra: { kind: null, id: null, rate: "0" }
      }));
      return;
    }

    const [kind, id] = value.split('-');
    const group = groups.find(g => g.group_id === id);
    
    if (group && group.members) {
      const totalRate = group.members.reduce((sum, member) => sum + (parseFloat(member.tax_rate) || 0), 0);
      setDefaultTaxRates(prev => ({
        ...prev,
        intra: { kind, id, rate: totalRate.toString() }
      }));
    }
  };

  const handleInterStateChange = (value) => {
    if (value === 'none') {
      setDefaultTaxRates(prev => ({
        ...prev,
        inter: { kind: null, id: null, rate: "0" }
      }));
      return;
    }

    const [kind, id] = value.split('-');
    const tax = taxes.find(t => t.tax_id === id);
    
    if (tax) {
      setDefaultTaxRates(prev => ({
        ...prev,
        inter: { kind, id, rate: tax.tax_rate.toString() }
      }));
    }
  };

  const getTaxTypeBadge = (taxType) => {
    const colors = {
      'CGST': 'bg-blue-100 text-blue-800',
      'SGST': 'bg-green-100 text-green-800', 
      'IGST': 'bg-purple-100 text-purple-800',
      'SEZ': 'bg-yellow-100 text-yellow-800',
      'NO_TAX': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={`text-xs ${colors[taxType] || 'bg-gray-100 text-gray-800'}`}>
        {taxType}
      </Badge>
    );
  };

  const getSelectedIntraDetails = () => {
    if (!defaultTaxRates.intra.id) return null;
    const group = groups.find(g => g.group_id === defaultTaxRates.intra.id);
    return group;
  };

  const getSelectedInterDetails = () => {
    if (!defaultTaxRates.inter.id) return null;
    const tax = taxes.find(t => t.tax_id === defaultTaxRates.inter.id);
    return tax;
  };

  const renderTaxDetails = (option, type) => {
    if (!option) return null;
    
    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm text-gray-900">{type === 'group' ? option.group_name : option.tax_name}</span>
          <span className="text-lg font-bold text-blue-600">{defaultTaxRates[type === 'group' ? 'intra' : 'inter'].rate}%</span>
        </div>
        
        {type === 'group' && option.members && (
          <div className="space-y-1">
            <p className="text-xs text-gray-600 mb-1">Tax Components:</p>
            {option.members.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1">
                  {getTaxTypeBadge(member.tax_type)}
                  <span>{member.tax_name}</span>
                </span>
                <span className="font-medium">{member.tax_rate}%</span>
              </div>
            ))}
          </div>
        )}
        
        {type === 'tax' && (
          <div className="flex items-center gap-2">
            {getTaxTypeBadge(option.tax_type)}
            <span className="text-xs text-gray-600">{option.description}</span>
          </div>
        )}
      </div>
    );
  };

  const igstTaxes = taxes.filter(tax => tax.tax_type === 'IGST');
  
  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-500" />
            Default Tax Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span>Loading tax configurations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-500" />
              Default Tax Rates
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Configure tax rates that will be applied to this service
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadDefaultTaxPreferences}
            disabled={loadingDefaults}
            className="flex items-center gap-1"
          >
            {loadingDefaults ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Load Defaults
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intra State Tax Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900">Intra State Tax</h3>
              <Info className="h-4 w-4 text-gray-400" title="Tax applicable within the same state (typically CGST + SGST)" />
            </div>
            
            <Select 
              value={defaultTaxRates.intra.id ? `group-${defaultTaxRates.intra.id}` : 'none'} 
              onValueChange={handleIntraStateChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select intra-state tax configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-gray-500">No Tax</span>
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.group_id} value={`group-${group.group_id}`}>
                    <div className="flex items-center justify-between w-full">
                      <span>{group.group_name}</span>
                      <span className="ml-2 text-blue-600 font-semibold">
                        {group.members ? group.members.reduce((sum, member) => sum + (parseFloat(member.tax_rate) || 0), 0) : 0}%
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {renderTaxDetails(getSelectedIntraDetails(), 'group')}
          </div>

          {/* Inter State Tax Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <h3 className="font-semibold text-gray-900">Inter State Tax</h3>
              <Info className="h-4 w-4 text-gray-400" title="Tax applicable for transactions across states (typically IGST)" />
            </div>
            
            <Select 
              value={defaultTaxRates.inter.id ? `tax-${defaultTaxRates.inter.id}` : 'none'} 
              onValueChange={handleInterStateChange}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select inter-state tax configuration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-gray-500">No Tax</span>
                </SelectItem>
                {igstTaxes.map((tax) => (
                  <SelectItem key={tax.tax_id} value={`tax-${tax.tax_id}`}>
                    <div className="flex items-center justify-between w-full">
                      <span>{tax.tax_name}</span>
                      <span className="ml-2 text-purple-600 font-semibold">{tax.tax_rate}%</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {renderTaxDetails(getSelectedInterDetails(), 'tax')}
          </div>
        </div>

        {/* Tax Rate Summary */}
        {/* {(parseFloat(defaultTaxRates.intra.rate) > 0 || parseFloat(defaultTaxRates.inter.rate) > 0) && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tax Rate Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-blue-700">Intra State Rate</p>
                <p className="text-2xl font-bold text-green-600">{defaultTaxRates.intra.rate || '0'}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-blue-700">Inter State Rate</p>
                <p className="text-2xl font-bold text-purple-600">{defaultTaxRates.inter.rate || '0'}%</p>
              </div>
            </div>
          </div>
        )} */}

        {/* Information Panel */}
        {(groups.length === 0 || igstTaxes.length === 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Tax Configuration Required</p>
                {groups.length === 0 && (
                  <p className="text-sm">• No intra-state tax groups found. Please create tax groups in Settings → Taxes.</p>
                )}
                {igstTaxes.length === 0 && (
                  <p className="text-sm">• No IGST taxes found. Please create IGST tax rates in Settings → Taxes.</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DefaultTaxRatesSection;
