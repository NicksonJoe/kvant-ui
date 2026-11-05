import type { CategoryMeta } from '../types';
import select from './select';
import nativeSelect from './native-select';
import combobox from './combobox';
import listbox from './listbox';
import cascader from './cascader';
import calendar from './calendar';
import datePicker from './date-picker';
import dateField from './date-field';
import timeField from './time-field';
import timePicker from './time-picker';
import colorPicker from './color-picker';
import fileUpload from './file-upload';
import signaturePad from './signature-pad';
import imageCropper from './image-cropper';
import treeSelect from './tree-select';
import transferList from './transfer-list';
import monthPicker from './month-picker';

const category: CategoryMeta = {
  id: 'pickers',
  title: 'Списки и пикеры',
  description: 'Выбор из списков, дат, времени, цвета и файлов.',
  components: [select, nativeSelect, combobox, listbox, cascader, calendar, datePicker, dateField, timeField, timePicker, colorPicker, fileUpload, signaturePad, imageCropper, treeSelect, transferList, monthPicker],
};

export default category;
