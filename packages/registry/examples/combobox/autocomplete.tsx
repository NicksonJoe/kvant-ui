import { MapPin } from 'lucide-react';
import { Autocomplete } from '@/kvant';

const cities = ['Москва', 'Санкт-Петербург', 'Казань', 'Нижний Новгород', 'Екатеринбург', 'Новосибирск', 'Калининград'];

export default function ComboboxAutocomplete() {
  return <Autocomplete aria-label="Город" placeholder="Город" prefix={<MapPin />} suggestions={cities} className="w-80" />;
}
