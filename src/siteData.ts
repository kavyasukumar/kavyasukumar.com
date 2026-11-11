import {
  Cpu,
  Newspaper,
  Kanban,
  CurrencyCircleDollar
} from '@phosphor-icons/react';

const SITE_DATA = {
  profile: {
    name: "KAVYA SUKUMAR",
    firstName: "Kavya",
    lastName: "Sukumar",
    title: "Creative Technologist",
    tagline: "A developer with a journalism habit, now investing in the future of media and community engagement.",
    location: "Bangalore, India",
    email: "hello@kavyasukumar.com",
    socials: {
      linkedin: "https://www.linkedin.com/in/kavya-sukumar/",
      github: "https://github.com/kavyasukumar",
      bluesky: "https://bsky.app/profile/thecaveat.bsky.social",
      instagram: "https://www.instagram.com/thecaveat/"
    }
  },
  navigation: [
    { name: "Evolution", id: "pivot" },
    { name: "Clips", id: "clips" },
    { name: "Contact", id: "contact" }
  ],
  currentPursuit: {
    role: "Chief Technology Officer",
    company: "Aspada Investments",
    location: "Bangalore, India",
    focus: "Building technology for critical decision-making in investment."
  },
  pivot: [
    {
      phase: "01",
      title: "ENGINEERING",
      subtitle: "Systems & Scalability",
      description: "Career foundation established at Microsoft, developing core features for global platforms including Xbox platform, MSN Games and Bing Videos.",
      icon: Cpu
    },
    {
      phase: "02",
      title: "JOURNALISM",
      subtitle: "Editorial Technology",
      description: "Held multiple roles across the content publishing space including investigative journalist, data editor, and editorial engineer at The Washington Post, Vox Media and The Palm Beach Post.",
      icon: Newspaper
    },
    {
      phase: "03",
      title: "PRODUCT MANAGEMENT",
      subtitle: "Product Leadership",
      description: "Led product development and strategy for media and media-adjacent platforms such as Hearken, focusing on user-centric design and data-driven decision making.",
      icon: Kanban
    },
    {
      phase: "04",
      title: "VENTURE CAPITAL",
      subtitle: "Strategic Leadership",
      description: "Building technology for critical decision-making in investment. Providing executive product leadership and advisory services to high-growth startups.",
      icon: CurrencyCircleDollar
    },
  ],
  pivotViz: {
    note: "I love presenting data as visuals. See my career evolution as a transit map.",
    label: "Visualize",
    href: "dataviz.html"
  },
  clips: [
    {
      source: "Nieman Lab",
      title: "Journalism’s identity crisis intensifies and decentralization ensues",
      snippet: "Exploring the shifting landscape of media trust and the emergence of decentralized information ecosystems.",
      url: "https://www.niemanlab.org/2023/12/journalisms-identity-crisis-intensifies-and-decentralization-ensues/",
      tags: ["writing", "media"]
    },
    {
      source: "Nieman Lab",
      title: "Belling the cat: The rise of independent fact-checking at scale",
      snippet: "Predictions on the future of accountability and the tools required to sustain independent verification.",
      url: "https://www.niemanlab.org/2022/12/belling-the-cat-the-rise-of-independent-fact-checking-at-scale/",
      tags: ["writing", "media"]
    },
    {
      source: "Vox.com",
      title: "How climate change will transform your city’s forecast",
      snippet: "A massive data journalism project visualizing the long-term impact of global warming on the daily weather of every major US city.",
      url: "https://www.vox.com/a/weather-climate-change-us-cities-global-warming",
      tags: ["data", "infographic", "engineering"]
    },
    {
      source: "Vox.com",
      title: "The Game of Thrones color spectrum, visualized",
      snippet: "An engineering-led analysis of cinematography and color palettes across the iconic series.",
      url: "https://www.vox.com/culture/2017/8/24/16162814/game-of-thrones-color-spectrum",
      tags: ["data", "infographic"]
    },
    {
      source: "Vox.com",
      title: "The bride, the groom, and the dowry dilemma",
      snippet: "A first-person exploration of cultural traditions and the modern dilemmas facing Indian marriages.",
      url: "https://www.vox.com/first-person/2017/2/6/14403490/dowry-india-bride-groom-dilemma",
      tags: ["writing", "infographic"]
    },
    {
      source: "OpenNews Source",
      title: "Introducing Autotune",
      snippet: "How Vox Media built a centralized system for making and managing newsroom graphics.",
      url: "https://source.opennews.org/articles/introducing-autotune/",
      tags: ["engineering", "media", "writing"]
    },
    {
      source: "OpenNews Source",
      title: "Building an Annotation Tool on a Dime",
      snippet: "Technical strategies for creating an open-source tool for newsroom to collaborate on annotating stories in near real-time.",
      url: "https://source.opennews.org/articles/building-annotation-tool-dime/",
      tags: ["engineering", "media", "writing"]
    }
  ]
};

export default SITE_DATA;