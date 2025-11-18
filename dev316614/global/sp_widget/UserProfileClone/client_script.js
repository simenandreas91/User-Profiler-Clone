function ($scope, $location, $uibModal, $window) {
	var c = this;

	c.searchText = "";
	c.results = $scope.data.results || [];
	c.lastQuery = $scope.data.lastQuery || "";
	c.state = {
		loading: false,
		error: ""
	};

	c.searchUsers = function() {
		c.state.error = "";
		var query = (c.searchText || "").trim();
		console.log("[UserProfileClone] client searchUsers input", {
			query: query,
			type: typeof query
		});

		if (!query) {
			c.results = [];
			c.lastQuery = "";
			return;
		}

		c.state.loading = true;
		// Use .get so the input payload (action/search) is actually sent to the server script
		$scope.server.get({
			action: "search_users",
			search: query
		}).then(function(response) {
			var payload = unwrap(response);
			console.log("[UserProfileClone] client searchUsers response", {
				payload: payload,
				resultsType: typeof payload.results
			});
			var list = payload.results || [];
			c.results = filterLocal(list, query);
			c.lastQuery = query;
		}).catch(function() {
			c.state.error = "Unable to search right now. Please try again.";
		}).finally(function() {
			c.state.loading = false;
		});
	};

	c.handleKey = function($event) {
		if ($event.key === "Enter") {
			$event.preventDefault();
			c.searchUsers();
		}
	};

	c.openProfile = function(user) {
		if (!user || !user.sys_id)
			return;

		c.jumpToFullProfile(user);
	};

	c.jumpToFullProfile = function(profile, $event) {
		$event && $event.stopPropagation();
		if (!profile || !profile.sys_id)
			return;
		var url = "?id=user_profile&sys_id=" + profile.sys_id;
		$window.open(url, "_blank");
	};

	function showProfileModal(profile) {
		$uibModal.open({
			templateUrl: "user-profile-modal.html",
			windowClass: "user-profile-modal",
			size: "md",
			controller: function($scope, $uibModalInstance, profile) {
				$scope.profile = profile;
				$scope.close = function() {
					$uibModalInstance.dismiss("close");
				};
			},
			resolve: {
				profile: function() { return profile; }
			}
		});
	}

	function unwrap(response) {
		var data = response;
		var seen = 0; // prevent runaway loops

		while (data && typeof data === "object" && seen < 5) {
			if (data.hasOwnProperty("data") && data.data)
				data = data.data;
			else if (data.hasOwnProperty("result") && data.result)
				data = data.result;
			else
				break;
			seen++;
		}

		return data || {};
	}

	function filterLocal(list, query) {
		var q = (query || "").toLowerCase();
		if (!q)
			return list;
		return list.filter(function(item) {
			return ((item.name || "").toLowerCase().indexOf(q) > -1) ||
				((item.title || "").toLowerCase().indexOf(q) > -1) ||
				((item.department || "").toLowerCase().indexOf(q) > -1);
		});
	}
}
