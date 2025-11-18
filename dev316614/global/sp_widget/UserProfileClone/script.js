(function() {
	gs.info("[UserProfileClone] server entry input=" + new global.JSON().encode(input));
	if (input && input.action === "update_session_tracking_info") {
		gs.getSession().putProperty("usage_tracking_allowed_for_session", input.user_tracking);
		return;
	}

	data.results = data.results || [];
	data.profile = data.profile || null;
	data.lastQuery = data.lastQuery || "";

	if (input && input.action === "search_users") {
		var searchTerm = input.search || input.q || resolveSearch(input);
		data.lastQuery = (searchTerm || "").trim();
		gs.info("[UserProfileClone] action=search_users lastQuery='" + data.lastQuery + "' input=" + new global.JSON().encode(input));
		data.results = searchUsers(data.lastQuery);
		gs.info("[UserProfileClone] action=search_users results_count=" + (data.results || []).length);
		return;
	}

	if (input && input.action === "get_profile") {
		data.profile = getProfile(input.sys_id);
		return;
	}

	// Initial load, nothing searched yet
	data.lastQuery = "";
	data.results = [];

	function searchUsers(query) {
		var trimmed = (query || "").trim();
		if (!trimmed)
			return [];
		var gr = new GlideRecordSecure("sys_user");
		gr.addActiveQuery();
		var nameQ = gr.addQuery("name", "STARTSWITH", trimmed);
		nameQ.addOrCondition("first_name", "STARTSWITH", trimmed);
		nameQ.addOrCondition("last_name", "STARTSWITH", trimmed);
		gs.info("[UserProfileClone] searchUsers trimmed='" + trimmed + "'", "UserProfile");
		gr.orderBy("name");
		//gr.setLimit(100);

		var results = [];
		gr.query();
		while (gr.next())
			results.push(buildCard(gr));

		return results;
	}

	function resolveSearch(inputObj) {
		return findSearch(inputObj, 0) || "";
	}

	function findSearch(obj, depth) {
		if (!obj || typeof obj !== "object" || depth > 4)
			return "";
		if (obj.search)
			return obj.search;
		for (var key in obj) {
			if (!obj.hasOwnProperty(key))
				continue;
			var child = obj[key];
			if (child && typeof child === "object") {
				var found = findSearch(child, depth + 1);
				if (found)
					return found;
			}
		}
		return "";
	}

	function buildCard(userGR) {
		return {
			sys_id: userGR.getUniqueValue(),
			name: userGR.getDisplayValue("name") || "",
			title: userGR.getDisplayValue("title") || "",
			phone: userGR.getDisplayValue("phone") || "",
			department: userGR.getDisplayValue("department") || "",
			photo: userGR.getDisplayValue("photo") || ""
		};
	}

	function getProfile(sysId) {
		if (!sysId)
			return null;

		var userGR = new GlideRecordSecure("sys_user");
		if (!userGR.get(sysId) || !userGR.canRead())
			return null;

		userGR = GlideScriptRecordUtil.get(userGR).getRealRecord();

		return {
			sys_id: sysId,
			name: userGR.getDisplayValue("name") || "",
			title: userGR.getDisplayValue("title") || "",
			department: userGR.getDisplayValue("department") || "",
			phone: userGR.getDisplayValue("phone") || "",
			mobile_phone: userGR.getDisplayValue("mobile_phone") || "",
			email: userGR.getDisplayValue("email") || "",
			location: userGR.getDisplayValue("location") || "",
			company: userGR.getDisplayValue("company") || "",
			manager: userGR.getDisplayValue("manager") || "",
			photo: userGR.getDisplayValue("photo") || ""
		};
	}
})();
