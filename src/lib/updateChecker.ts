// Update checker utility
// Checks GitHub Releases for the latest version

const GITHUB_OWNER = 'takatetsu';
const GITHUB_REPO = 'writto';
const CURRENT_VERSION = '0.8.1';

interface GitHubRelease {
    tag_name: string;
    html_url: string;
    name: string;
    published_at: string;
}

export interface UpdateInfo {
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseUrl: string;
    releaseName: string;
}

// Compare version strings (e.g., "0.8.1" vs "0.9.0")
function compareVersions(current: string, latest: string): number {
    const currentParts = current.replace(/^v/, '').split('.').map(Number);
    const latestParts = latest.replace(/^v/, '').split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const a = currentParts[i] || 0;
        const b = latestParts[i] || 0;
        if (a < b) return -1;
        if (a > b) return 1;
    }
    return 0;
}

export async function checkForUpdates(): Promise<UpdateInfo> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Writto-App'
                }
            }
        );

        if (!response.ok) {
            console.log('Failed to fetch release info:', response.status);
            return {
                hasUpdate: false,
                currentVersion: CURRENT_VERSION,
                latestVersion: CURRENT_VERSION,
                releaseUrl: '',
                releaseName: ''
            };
        }

        const release: GitHubRelease = await response.json();
        const latestVersion = release.tag_name.replace(/^v/, '');
        const hasUpdate = compareVersions(CURRENT_VERSION, latestVersion) < 0;

        return {
            hasUpdate,
            currentVersion: CURRENT_VERSION,
            latestVersion,
            releaseUrl: release.html_url,
            releaseName: release.name || `v${latestVersion}`
        };
    } catch (error) {
        console.error('Error checking for updates:', error);
        return {
            hasUpdate: false,
            currentVersion: CURRENT_VERSION,
            latestVersion: CURRENT_VERSION,
            releaseUrl: '',
            releaseName: ''
        };
    }
}
