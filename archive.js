const puppeteer = require("puppeteer");
const https = require("follow-redirects").https;
const fs = require("fs");

const year_regex = /^\d{4}/;
//const year_regex = /202\d/;

const qrtr_regex = /QTR\d/;
const file_regex = /\d+.nc.tar.gz/;
const base_url = "https://www.sec.gov/Archives/edgar/Feed/";
const user_agent = "Ghost2.0 Incoporated ghost@ghost2.0.com";

const base_output_dir = "~/data2/sec_data/filings/";

function sleep() {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

// TODO: Make this smarter by adhearing to the leaky bucket algorithm.
async function sleep_then_goto(page, url) {
  // Wait for a random amount of time between 8 and 15 seconds
  await sleep();
  await page.goto(url, { waitUntil: "networkidle2" });
}

async function extract_links(page, regex) {
  let links_raw = await page.$x("//td/a");
  let links = [];

  for (let i = 0; i < links_raw.length; i++) {
    let link = await page.evaluate(
      (el) => el.getAttribute("href"),
      links_raw[i]
    );
    if (regex.test(link)) {
      links.push(link);
    }
  }

  return links;
}

(async () => {
  // Do this forever.
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent(user_agent);
  await page.goto(base_url);

  // Get the links for the different years.
  let year_links = await extract_links(page, year_regex);

  for (const year_link of year_links) {
    // We can go to the next page...
    await sleep_then_goto(page, `${base_url}${year_link}`);

    // Get all of the quarterly links and resolve them all
    let qrtr_links = await extract_links(page, qrtr_regex);

    // This is where we can get the links for the quarterly files
    for (const qrtr_link of qrtr_links) {
      console.log(`Downloading ${base_url}${year_link}${qrtr_link}...`);

      // Now we can go into the quaretly pages and download all the index files...
      await sleep_then_goto(page, `${base_url}${year_link}${qrtr_link}`);

      // Extract all of the master links and resolve them all
      let file_links = await extract_links(page, file_regex);

      file_links = file_links.map(
        (x) => `${base_url}${year_link}${qrtr_link}${x}`
      );

      let content = "\n" + file_links.join("\n");

      fs.writeFileSync("archive_links.txt", content, {
        flag: "a+",
      });
    }
  }

  await browser.close();
})();
