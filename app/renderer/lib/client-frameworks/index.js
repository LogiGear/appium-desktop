import JsWdFramework from './js-wd';
import JsWdIoFramework from './js-wdio';
import JavaFramework from './java';
import PythonFramework from './python';
import RubyFramework from './ruby';
import RobotFramework from './robot';
import GondolaFrameWork from './gondola';

const frameworks = {
  jsWd: JsWdFramework,
  jsWdIo: JsWdIoFramework,
  java: JavaFramework,
  python: PythonFramework,
  ruby: RubyFramework,
  robot: RobotFramework,
  gondola: GondolaFrameWork,
};

export default frameworks;
