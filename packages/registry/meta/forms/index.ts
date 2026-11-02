import type { CategoryMeta } from '../types';
import field from './field';
import fieldset from './fieldset';
import form from './form';
import input from './input';
import textarea from './textarea';
import inputGroup from './input-group';
import searchField from './search-field';
import passwordInput from './password-input';
import numberField from './number-field';
import otpInput from './otp-input';
import tagsInput from './tags-input';
import maskedInput from './masked-input';
import editable from './editable';
import richTextEditor from './rich-text-editor';
import mention from './mention';

const category: CategoryMeta = {
  id: 'forms',
  title: 'Формы и ввод',
  description: 'Подписи и ошибки полей, ввод текста, чисел, кодов и паролей.',
  components: [field, fieldset, form, input, textarea, inputGroup, searchField, passwordInput, numberField, otpInput, tagsInput, maskedInput, editable, richTextEditor, mention],
};

export default category;
