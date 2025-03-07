# NOTICE

This site is being replaced at some point for a newer and better version. Functionally speaking, everything is exactly the same - I've just updated the code to a more modern/maintainable format. At some point, this version will no longer be maintained. I'm not sure how long that will be.

You can find the newer V2 version hosted here: https://kevinallenwiegand.ddns.net/ffxivfashionreportv2

And here is the repository: https://github.com/KevinAllenWiegand/ffxiv-fashion-report-v2

If you've been using this site, you will be happy to know that loading the new site will automatically migrate your tracked items. Please note that this is a one-time thing, so if you migrate over, and then continue to use the original site, those changes will not reflect in the new site.

NOTE: You can use your browser's Dev Tools to remove the local storage item from the V2 version, which will cause the migration to happen again. Alternatively, you can "Backup" your items from the V1 site, and "Restore" them to the V2 site as well.

# Instructions

Self-hosted at https://kevinallenwiegand.ddns.net/ffxivfashionreport

This may change in the future.

## To Build the Website into the "dist" Folder

```
npm run build
```

This will create the needed static files to run the website, which you can just open up locally if you want.

## To Host the Website in a Dev Server

```
npm run start
```

Really, the only reason you would want to do this is for debugging purposes.