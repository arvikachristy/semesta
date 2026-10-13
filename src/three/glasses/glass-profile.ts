export interface IProfilePoint {
  height: number;
  radius: number;
}

// Integrate each straight profile segment as a conical frustum.
export const profileVolume = (profile: readonly IProfilePoint[]) =>
  profile.slice(1).reduce((volume, point, index) => {
    const previous = profile[index];
    return (
      volume +
      (Math.PI *
        (point.height - previous.height) *
        (previous.radius ** 2 + previous.radius * point.radius + point.radius ** 2)) /
        3
    );
  }, 0);

export const profileWallAt = (profile: readonly IProfilePoint[], height: number) => {
  const top = profile[profile.length - 1];
  const index = Math.max(
    1,
    profile.findIndex((point) => point.height >= height),
  );
  const end = height >= top.height ? top : profile[index];
  const start = height >= top.height ? profile[profile.length - 2] : profile[index - 1];
  const slope = (end.radius - start.radius) / (end.height - start.height);
  return {
    radius:
      start.radius +
      slope * (Math.max(profile[0].height, Math.min(height, top.height)) - start.height),
    slope,
  };
};

// Headroom is a share of bowl volume, independent of stem height.
export const findProfileFillHeight = (profile: readonly IProfilePoint[], usableVolume: number) => {
  let low = profile[0].height;
  let high = profile[profile.length - 1].height;
  for (let iteration = 0; iteration < 48; iteration++) {
    const height = (low + high) / 2;
    const partial = [
      ...profile.filter((point) => point.height < height),
      { height, radius: profileWallAt(profile, height).radius },
    ];
    if (profileVolume(partial) < usableVolume) {
      low = height;
    } else {
      high = height;
    }
  }
  return (low + high) / 2;
};
