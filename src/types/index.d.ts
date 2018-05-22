type InstallSteps = {
  [key: string]: {
    title: string,
    process: () => number,
  },
}

export { InstallSteps }
