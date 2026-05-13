interface MomentInteractionsState {
  name: string;
  upvoteCount: number;
  commentCount: number;
  upvoted: boolean;
  init(): void;
  fetchStats(): Promise<void>;
  handleUpvote(): Promise<void>;
}

export default (name: string): MomentInteractionsState => ({
  name,
  upvoteCount: 0,
  commentCount: 0,
  upvoted: false,

  init() {
    const upvotedNames = JSON.parse(localStorage.getItem("halo.upvoted.moment.names") || "[]");
    this.upvoted = upvotedNames.includes(this.name);
    void this.fetchStats();
  },

  async fetchStats() {
    try {
      const response = await fetch(`/apis/api.moment.halo.run/v1alpha1/moments/${this.name}`);
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      this.upvoteCount = Number(result?.stats?.upvote ?? 0);
      this.commentCount = Number(result?.stats?.approvedComment ?? result?.stats?.totalComment ?? 0);
    } catch (error) {
      console.error("Failed to fetch moment stats:", error);
    }
  },

  async handleUpvote() {
    if (this.upvoted) {
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/apis/api.halo.run/v1alpha1/trackers/upvote");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = () => {
      this.upvoted = true;
      this.upvoteCount += 1;

      const upvotedNames = JSON.parse(localStorage.getItem("halo.upvoted.moment.names") || "[]");
      localStorage.setItem("halo.upvoted.moment.names", JSON.stringify([...upvotedNames, this.name]));
    };

    xhr.onerror = function () {
      alert(window.i18nResources["jsModule.upvote.networkError"]);
    };

    xhr.send(
      JSON.stringify({
        group: "moment.halo.run",
        plural: "moments",
        name: this.name,
      }),
    );
  },
});
