import { useSEO } from '../../hooks/useSEO';

/**
 * Declarative wrapper around `useSEO` for routes that prefer component-style
 * composition. Behaves identically to the hook — it only exists so route
 * components can write `<SEO title="..." />` alongside their JSX instead of
 * threading an additional hook at the top of the file.
 *
 * @param {Parameters<typeof useSEO>[0]} props
 */
export default function SEO(props) {
  useSEO(props);
  return null;
}
