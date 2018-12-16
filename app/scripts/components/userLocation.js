import { mapState } from 'vuex';
import throttle from 'lodash.throttle';

export default {
  template: '#user-location',
  data() {
    return {
      location: {
        homeArea: true,
      },
      locationOptions: [],
      searchingForLocation: false,
      googleMapsApiKey: 'AIzaSyBTDmU-TvOA6Hb6lJap1-ssYMPc8revfkA',
      apiURL: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    };
  },
  computed: mapState({
    order: state => state.order,
    payment: 'payment',
    deliveryLocation: 'deliveryLocation',
    loading: 'loading',
  }),
  mounted() {
    if (this.payment) {
      Materialize.toast('Payment completed successfully!', 3000);
    }
  },
  methods: {
    selectThisLocation(selectedPlaceId) {
      let deliveryLocation = this.locationOptions.filter(place => place.id === selectedPlaceId);
      deliveryLocation = deliveryLocation.length ? deliveryLocation[0] : null;

      const {
        geometry: {
          location: { lat, lng: long },
        },
        id, place_id, name, vicinity,
      } = deliveryLocation;
      deliveryLocation = { id, place_id, name, vicinity, lat, long };
      console.log(deliveryLocation);

      this.$store.commit('setDeliveryLocation', deliveryLocation);
      $.post(`https://vitumob-prod.appspot.com/cart/${this.order.order_hex}/location`, {
        delivery_location: JSON.stringify(deliveryLocation),
        home_area: this.location.homeArea,
      }).done(response => {
        console.log(response);
        this.$router.push({ name: 'checkedOut' });
      }).catch(error => {
        console.error(error);
      });
    },
    searchForLocation() {
      const geolocationOptions = {
        maximumAge: 1800000, // 30 minutes
      };
      const onError = error => { throw error; };
      const onSuccess = ({ coords }) => {
        const params = [
          `location=${coords.latitude},${coords.longitude}`,
          'radius=5000',
          `keyword=${this.location.search}`,
          `key=${this.googleMapsApiKey}`,
        ];

        const resourceURL = `${this.apiURL}?${params.join('&')}`;
        this.getPlacesFromGoogleMapsApi(resourceURL, this);
      };

      if (this.location.search && this.location.search.length >= 3) {
        this.searchingForLocation = true;
        navigator.geolocation.getCurrentPosition(onSuccess, onError, geolocationOptions);
      }
    },
    getPlacesFromGoogleMapsApi: throttle((resourceURL, scope) => {
      $.get(resourceURL).done(response => {
        scope.locationOptions = response.results;
        scope.searchingForLocation = false;
      });
    }, 1500, { trailing: true }),
  },
};
