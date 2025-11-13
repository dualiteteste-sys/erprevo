import React, { useState } from 'react';
import { EnderecoPayload } from '@/services/partners';
import { Loader2, Search } from 'lucide-react';
import Input from '@/components/ui/forms/Input';
import Select from '@/components/ui/forms/Select';
import { cepMask } from '@/lib/masks';
import { fetchCepData } from '@/services/externalApis';
import { useToast } from '@/contexts/ToastProvider';
import { UFS } from '@/lib/constants';

interface AddressFieldsProps {
  address: EnderecoPayload;
  onAddressChange: (field: keyof EnderecoPayload, value: any) => void;
  title: string;
}

const AddressFields: React.FC<AddressFieldsProps> = ({ address, onAddressChange, title }) => {
  const { addToast } = useToast();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const handleCepSearch = async () => {
    const cep = address.cep?.replace(/\D/g, '');
    if (!cep || cep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const data = await fetchCepData(cep);
      onAddressChange('logradouro', data.logradouro || '');
      onAddressChange('bairro', data.bairro || '');
      onAddressChange('cidade', data.localidade || '');
      onAddressChange('uf', data.uf || '');
      addToast(`Endereço para o CEP ${cep} encontrado!`, 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setIsFetchingCep(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50/50 relative">
      <h4 className="font-medium text-gray-700 mb-4">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
        <div className="sm:col-span-2">
          <label htmlFor={`cep-${title}`} className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
          <div className="relative">
            <input
              id={`cep-${title}`}
              name="cep"
              value={cepMask(address.cep || '')}
              onChange={e => onAddressChange('cep', e.target.value)}
              onBlur={handleCepSearch}
              placeholder="00000-000"
              className="w-full p-3 bg-white/80 border border-gray-300 rounded-lg pr-10"
            />
            <div className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
              {isFetchingCep ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            </div>
          </div>
        </div>
        <Input
          label="Município"
          name="cidade"
          value={address.cidade || ''}
          onChange={e => onAddressChange('cidade', e.target.value)}
          className="sm:col-span-3"
        />
        <Select
          label="UF"
          name="uf"
          value={address.uf || ''}
          onChange={e => onAddressChange('uf', e.target.value)}
          className="sm:col-span-1"
        >
          <option value="">UF</option>
          {UFS.map(uf => <option key={uf.value} value={uf.value}>{uf.value}</option>)}
        </Select>

        <Input
          label="Endereço"
          name="logradouro"
          value={address.logradouro || ''}
          onChange={e => onAddressChange('logradouro', e.target.value)}
          className="sm:col-span-6"
        />

        <Input
          label="Bairro"
          name="bairro"
          value={address.bairro || ''}
          onChange={e => onAddressChange('bairro', e.target.value)}
          className="sm:col-span-3"
        />
        <Input
          label="Número"
          name="numero"
          value={address.numero || ''}
          onChange={e => onAddressChange('numero', e.target.value)}
          className="sm:col-span-1"
        />
        <Input
          label="Complemento"
          name="complemento"
          value={address.complemento || ''}
          onChange={e => onAddressChange('complemento', e.target.value)}
          className="sm:col-span-2"
        />
      </div>
    </div>
  );
};

export default AddressFields;
