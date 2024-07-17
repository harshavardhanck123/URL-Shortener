const URL = require("../models/URL");
const shortid = require("shortid");

const urlController = {
  createShortUrl: async (req, res) => {
    const { longUrl } = req.body;

    try {
      let url = await URL.findOne({ longUrl });

      if (url) {
        return res.json(url);
      }

      const shortUrl = shortid.generate();
      url = new URL({
        longUrl,
        shortUrl,
      });

      await url.save();

      res.json(url);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },

  getShortUrl: async (req, res) => {
    try {
      const url = await URL.findOne({ shortUrl: req.params.shortUrl });

      if (!url) {
        return res.status(404).json("No URL found");
      }

      url.clicks++;
      await url.save();

      res.redirect(url.longUrl);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  },

  getUrls: async (req, res) => {
    try {
      const urls = await URL.find();
      res.json(urls);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
};

module.exports = urlController;
