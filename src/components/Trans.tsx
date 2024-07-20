// Trans.tsx
import { FC, JSXNode, cloneElement } from "hono/jsx";
import i18next from "i18next";

interface TransProps {
  i18nKey: string;
  values: Record<string, string>;
  components: JSXNode[];
}

const Trans: FC<TransProps> = ({ i18nKey, values, components }) => {
  const translation = i18next.t(i18nKey, values);
  const regex = /<(\d+)>(.*?)<\/\d+>/g;

  let result: (string | JSXNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(translation)) !== null) {
    const [fullMatch, index, content] = match;
    const precedingText = translation.substring(lastIndex, match.index);
    if (precedingText) {
      result.push(precedingText);
    }
    const componentIndex = parseInt(index, 10);
    result.push(cloneElement(components[componentIndex], {}, content));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < translation.length) {
    result.push(translation.substring(lastIndex));
  }

  return <>{result}</>;
};

export default Trans;
