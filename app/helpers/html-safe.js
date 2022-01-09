import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export default helper(function (params/*, hash*/) {
  return new htmlSafe(params.join(''));
});
