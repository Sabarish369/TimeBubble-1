// Smart suggestions feature deactivated - replaced with auto-schedule timeline feature
export function useSmartSuggestions() {
  return {
    suggestions: [],
    isLoading: false,
    activeSuggestion: null,
    showTooltip: false,
    generateSuggestions: () => {},
    acceptSuggestion: () => {},
    dismissSuggestion: () => {},
    dismissAllSuggestions: () => {},
    hideTooltip: () => {},
    navigateSuggestions: () => {}
  };
}
